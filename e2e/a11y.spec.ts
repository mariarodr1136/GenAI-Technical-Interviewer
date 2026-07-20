import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Scans key screens against WCAG 2.1 A/AA with axe-core. Violations are
// reported as {rule, impact, targets} so failures are readable in CI logs.
async function expectNoViolations(page: Page): Promise<void> {
  // Freeze animations/transitions: axe samples computed colors, and catching a
  // fade or the blinking status pills mid-frame reports phantom contrast bugs.
  await page.addStyleTag({
    content: "*, *::before, *::after { animation: none !important; transition: none !important; }"
  });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // CodeMirror's scroller is flagged as a scrollable region that isn't
    // focusable, but its child contenteditable content is keyboard-reachable.
    .exclude(".cm-scroller")
    .analyze();
  const summary = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    targets: v.nodes.map((n) => n.target.join(" ")).slice(0, 5)
  }));
  expect(summary).toEqual([]);
}

async function enterApp(page: Page): Promise<void> {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.goto("/");
  await page.getByRole("button", { name: /start practicing free/i }).click();
  await expect(page.getByRole("heading", { name: "GenAI Interviewer" })).toBeVisible();
}

test("landing page has no accessibility violations", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: /start practicing free/i })).toBeVisible();
  await expectNoViolations(page);
});

test("interview screen with the code panel open has no violations", async ({ page }) => {
  await enterApp(page);
  await page.getByRole("button", { name: "Attach Code" }).click();
  await expect(page.locator(".cm-content")).toBeVisible();
  await expectNoViolations(page);
});

test("interview screen in dark mode has no violations", async ({ page }) => {
  await enterApp(page);
  await page.getByRole("button", { name: /switch to dark mode/i }).click();
  await expectNoViolations(page);
});

test("job description modal traps focus, closes on Escape, has no violations", async ({ page }) => {
  await enterApp(page);
  await page.getByRole("button", { name: "Job Description" }).click();

  const dialog = page.getByRole("dialog", { name: "Job description" });
  await expect(dialog).toBeVisible();
  await expectNoViolations(page);

  // Tab cycles stay inside the dialog.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(inside).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
