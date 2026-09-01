import { expect, test } from "@playwright/test";

test("private workspace redirects anonymous visitors and accepts a local account", async ({ page }) => {
  await page.goto("/workspace");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Email").fill(`researcher-${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("evidence-first-123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/workspace$/);
  await expect(page.getByRole("heading", { name: "Investigations", exact: true })).toBeVisible();
  await expect(page.getByText("No investigations yet")).toBeVisible();
});
