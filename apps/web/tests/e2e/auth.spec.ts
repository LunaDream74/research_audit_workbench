import { expect, test } from "@playwright/test";

test("private workspace redirects anonymous visitors and accepts a local account", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Audit your own runs" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Subtle audit/ })).toHaveAttribute("download", "");
  await page.getByRole("link", { name: "Audit your own runs" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fworkspace%2Fimports$/);

  await page.getByLabel("Email").fill(`researcher-${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("evidence-first-123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/workspace\/imports$/);
  await expect(page.getByRole("heading", { name: "Review before anything is saved" })).toBeVisible();
  const sampleDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: /Metric-definition mismatch/ }).click();
  const samplePath = await (await sampleDownload).path();
  if (!samplePath) throw new Error("The prepared sample did not download");
  await page.getByLabel("Select prepared ZIP").setInputFiles(samplePath);
  await page.getByRole("button", { name: "Create review" }).click();
  await expect(page.getByRole("heading", { name: "Ranking aggregation comparison" })).toBeVisible();
  await page.goto("/workspace");
  await expect(page.getByRole("heading", { name: "Investigations", exact: true })).toBeVisible();
  await expect(page.getByText("No investigations yet")).toBeVisible();
});
