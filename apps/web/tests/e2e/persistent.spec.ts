import { expect, test } from "@playwright/test";
import { preparedPackageZip } from "./zip-fixture";

test("a researcher saves, challenges, approves, and reloads an exact decision", async ({ page }) => {
  test.setTimeout(60_000);
  const email = `decision-${Date.now()}@example.test`;
  const password = "evidence-first-123";

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/workspace$/);

  await page.goto("/workspace/imports");
  await page.getByLabel("Select prepared ZIP").setInputFiles({
    name: "prepared-retrieval.zip",
    mimeType: "application/zip",
    buffer: preparedPackageZip(),
  });
  await page.getByRole("button", { name: "Create review" }).click();
  await expect(page.getByRole("heading", { name: "Rain retrieval comparison" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm reviewed import" }).click();
  await page.getByRole("link", { name: "Continue to investigations" }).click();
  await page.getByRole("link", { name: "Start durable investigation" }).click();

  await page.getByRole("button", { name: "Save finding and create investigation" }).click();
  await expect(page.getByText("Finding confirmed · revision 1")).toBeVisible();
  await page.getByRole("button", { name: "Preview revised interpretation" }).click();
  await expect(page.getByText("Valid sanity-check result; unsuitable for direct baseline comparison.")).toBeVisible();
  await page.getByRole("button", { name: "Confirm challenge and revision" }).click();
  await expect(page.getByRole("heading", { name: "Approve only the exact matched reevaluation" })).toBeVisible();

  await page.getByLabel("Batch size").fill("16");
  await page.getByRole("button", { name: "Save validated draft" }).click();
  await expect(page.getByText("Batch size changed for operational fit", { exact: false })).toBeVisible();
  await expect(page.locator(".digest-line code")).toHaveText(/^[a-f0-9]{64}$/);
  await page.getByRole("button", { name: "Approve exact plan" }).click();

  await expect(page).toHaveURL(/\/workspace\/investigations\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: "Plan v1 · approved" })).toBeVisible();
  await expect(page.getByText("plan_approved")).toBeVisible();
  await page.screenshot({ path: "../../test-results/persistent-checkpoint.png", fullPage: true });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Plan v1 · approved" })).toBeVisible();
  await expect(page.getByText("No audit, agent action, or experiment execution resumes automatically.")).toBeVisible();
});
