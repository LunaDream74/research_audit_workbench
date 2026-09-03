import { expect, test } from "@playwright/test";

test("the subtle sample isolates and retains a metric-definition blocker", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/login");
  await page.getByLabel("Email").fill(`metric-${Date.now()}@example.test`);
  await page.getByLabel("Password").fill("evidence-first-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.goto("/workspace/imports");

  const sampleDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: /Metric-definition mismatch/ }).click();
  const samplePath = await (await sampleDownload).path();
  if (!samplePath) throw new Error("The metric-definition sample did not download");
  await page.getByLabel("Select prepared ZIP").setInputFiles(samplePath);
  await page.getByRole("button", { name: "Create review" }).click();
  await expect(page.getByRole("heading", { name: "Ranking aggregation comparison" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm reviewed import" }).click();
  await page.getByRole("link", { name: "Audit these runs" }).click();

  await page.getByRole("button", { name: "Run comparability audit" }).click();
  await expect(page.getByRole("heading", { name: "Candidate-pool sizes match" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evaluation split matches" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Preprocessing matches" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Metric definitions differ" })).toBeVisible();

  await page.getByRole("button", { name: "Save complete audit and create investigation" }).click();
  await expect(page.getByLabel("Researcher context")).toHaveValue("");
  await page.getByRole("button", { name: "Use this sample context" }).click();
  await expect(page.getByLabel("Researcher context")).toHaveValue(/micro-averaged and Run B is macro-averaged/);
  await page.getByRole("button", { name: "Preview my revised interpretation" }).click();
  await expect(page.locator(".challenge-diff .retained")).toContainText("Run A uses nDCG@10 micro-averaged");
});
