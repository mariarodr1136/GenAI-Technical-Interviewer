import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

// Exercises the real pdf.js parse path with a real PDF — no mocks. The unit
// tests stub pdf.js, so without this nothing catches a pdfjs-dist upgrade
// breaking resume extraction. It has to run in a browser: pdf.js needs
// DOMMatrix, which neither Node nor jsdom provides.
const FIXTURE = fileURLToPath(new URL("./fixtures/sample-resume.pdf", import.meta.url));

test("a real PDF resume is parsed in the browser", async ({ page }) => {
  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.goto("/");
  await page.getByRole("button", { name: /start practicing free/i }).click();
  await page.getByRole("button", { name: /^Resume/ }).click();

  await page.locator('input[type="file"]').setInputFiles(FIXTURE);

  // pdf.js loads its worker lazily, so give the parse room beyond the default.
  await expect(page.getByLabel("Resume text")).toHaveValue(/Maria Rodriguez/, { timeout: 20_000 });
  await expect(page.getByLabel("Resume text")).toHaveValue(/Software Engineer/);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
