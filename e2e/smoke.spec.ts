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
  await page.getByPlaceholder(/write or paste code here/i).fill("console.log(21 * 2);");
  await page.getByRole("button", { name: "Run", exact: true }).click();

  await expect(page.getByLabel("Run output")).toContainText("42");
});
