import { expect, test } from "@playwright/test";

// Smoke test: landing page → interview screen → mocked first question →
// text-mode answer → streamed reply renders. All /api calls are mocked, so
// this exercises the real client (routing, SSE parsing, state) without Groq.
test("candidate can start an interview and complete a text turn", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.route("**/api/interview/start", (route) =>
    route.fulfill({ json: { question: "Welcome! Tell me about a project you are proud of." } })
  );
  await page.route("**/api/interview/text-turn", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: [
        'data: {"transcript":"I built a voice-driven interview practice app."}',
        "",
        'data: {"delta":"Nice. "}',
        "",
        'data: {"done":true,"reply":"Nice. What was the hardest bug you hit?"}',
        "",
        ""
      ].join("\n")
    })
  );

  await page.goto("/");
  await expect(page.getByRole("button", { name: /start practicing free/i })).toBeVisible();
  await page.getByRole("button", { name: /start practicing free/i }).click();

  await expect(page.getByRole("heading", { name: "GenAI Interviewer" })).toBeVisible();

  // Mute TTS so the test never depends on headless speech synthesis.
  await page.getByRole("button", { name: /voice on/i }).click();

  await page.getByRole("button", { name: /begin interview/i }).click();
  await expect(page.getByText("Tell me about a project you are proud of.")).toBeVisible();

  await page.getByRole("button", { name: "Type" }).click();
  await page
    .getByPlaceholder(/type your answer/i)
    .fill("I built a voice-driven interview practice app.");
  await page.getByRole("button", { name: /submit answer/i }).click();

  await expect(page.getByText("What was the hardest bug you hit?")).toBeVisible();
  await expect(page.getByText("1 turn", { exact: true })).toBeVisible();
});

// Exercises the real Web Worker sandbox — no mocks involved.
test("attached JavaScript runs in the in-browser sandbox", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));

  await page.goto("/");
  await page.getByRole("button", { name: /start practicing free/i }).click();

  await page.getByRole("button", { name: "Attach Code" }).click();
  const editor = page.locator(".cm-content");
  await editor.click();
  await editor.fill("console.log(21 * 2);");
  await page.getByRole("button", { name: "Run", exact: true }).click();

  await expect(page.getByLabel("Run output")).toContainText("42");
});

// Ending before the first answer used to ask for a debrief anyway, get a 400
// back ("No conversation history to debrief."), and leave the session running.
test("ending before answering ends the session without a debrief", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.route("**/api/interview/start", (route) =>
    route.fulfill({ json: { question: "Welcome! Tell me about a project you are proud of." } })
  );
  let debriefCalls = 0;
  await page.route("**/api/interview/debrief", (route) => {
    debriefCalls += 1;
    return route.fulfill({ status: 400, json: { error: "No conversation history to debrief." } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /start practicing free/i }).click();
  await page.getByRole("button", { name: /voice on/i }).click();
  await page.getByRole("button", { name: /begin interview/i }).click();
  await expect(page.getByText("Tell me about a project you are proud of.")).toBeVisible();

  // The control promises only what it can deliver, and delivers it.
  await page.getByRole("button", { name: /^end interview$/i }).click();

  await expect(page.getByRole("button", { name: /begin interview/i })).toBeVisible();
  await expect(page.getByText("Tell me about a project you are proud of.")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(debriefCalls).toBe(0);
});

// Discard & Restart is the escape hatch for a run you would rather not keep:
// no debrief request, and nothing written to the saved-session history.
test("discard clears an answered session without saving it", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.route("**/api/interview/start", (route) =>
    route.fulfill({ json: { question: "Welcome! Tell me about a project you are proud of." } })
  );
  await page.route("**/api/interview/text-turn", (route) =>
    route.fulfill({
      contentType: "text/event-stream",
      body: [
        'data: {"transcript":"I built an interview practice app."}',
        "",
        'data: {"done":true,"reply":"Nice. What was the hardest bug you hit?"}',
        "",
        ""
      ].join("\n")
    })
  );
  let debriefCalls = 0;
  await page.route("**/api/interview/debrief", (route) => {
    debriefCalls += 1;
    return route.fulfill({ json: { rating: "Solid", strengths: [], improvements: [] } });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /start practicing free/i }).click();
  await page.getByRole("button", { name: /voice on/i }).click();
  await page.getByRole("button", { name: /begin interview/i }).click();
  await page.getByRole("button", { name: "Type" }).click();
  await page.getByPlaceholder(/type your answer/i).fill("I built an interview practice app.");
  await page.getByRole("button", { name: /submit answer/i }).click();
  await expect(page.getByText("What was the hardest bug you hit?")).toBeVisible();

  await page.getByRole("button", { name: /discard & restart/i }).click();

  await expect(page.getByRole("button", { name: /begin interview/i })).toBeVisible();
  await expect(page.getByText("What was the hardest bug you hit?")).toHaveCount(0);
  expect(debriefCalls).toBe(0);
  // The debrief path writes this key, so an empty one means nothing was kept.
  expect(await page.evaluate(() => localStorage.getItem("genai_interview_sessions"))).toBeNull();
});

// Split view: the divider resizes the controls panel and the header toggle
// collapses it so the transcript takes the full width.
test("the controls panel can be resized and collapsed", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));

  await page.goto("/");
  await page.getByRole("button", { name: /start practicing free/i }).click();

  const panel = page.locator(".control-panel");
  const startWidth = (await panel.boundingBox())!.width;

  // Keyboard resize from the divider — same path the pointer drag drives.
  await page.getByRole("separator", { name: /resize the controls panel/i }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await panel.boundingBox())!.width).toBe(startWidth + 40);

  // Past the maximum it stops rather than eating the transcript.
  for (let i = 0; i < 30; i += 1) await page.keyboard.press("ArrowRight");
  await expect.poll(async () => (await panel.boundingBox())!.width).toBe(560);

  await page.getByRole("button", { name: /hide the controls panel/i }).click();
  await expect(panel).toBeHidden();
  await expect(page.getByRole("separator", { name: /resize/i })).toBeHidden();
  // Fully closed, not a sliver: padding and border collapse with the column.
  await expect.poll(async () => (await panel.boundingBox())?.width ?? 0).toBe(0);
  // The rail is what is left behind, and it is how you get the panel back.
  await expect(page.getByRole("button", { name: /show the controls panel/i })).toBeVisible();

  await page.getByRole("button", { name: /show the controls panel/i }).click();
  await expect(panel).toBeVisible();
  await expect.poll(async () => (await panel.boundingBox())!.width).toBe(560);
});
