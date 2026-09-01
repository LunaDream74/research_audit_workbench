import { expect, test } from "@playwright/test";

test("the prepared walkthrough is evidence-first and disposable", async ({ page }) => {
  const privateRequests: string[] = [];
  page.on("request", (request) => {
    if (/supabase|\/api\/investigations|\/api\/imports\/confirm/i.test(request.url())) {
      privateRequests.push(request.url());
    }
  });

  await page.goto("/demo");
  await expect(page.getByText("Demo data · nothing is saved")).toBeVisible();
  await expect(page.getByText("Comparing Run A and Run B")).toBeVisible();
  await expect(page.getByText("84%")).toBeVisible();
  await expect(page.getByText("76%")).toBeVisible();
  await page.getByRole("button", { name: "Run prepared audit" }).click();
  await expect(page.getByText("Model improvement not established.")).toBeVisible();
  await page.getByRole("button", { name: "Inspect cited evidence" }).click();
  await expect(page.getByText("200 candidates")).toBeVisible();
  await expect(page.getByText("1,000 candidates")).toBeVisible();
  await expect(page.getByText("Illustrative only · does not quantify causality")).toBeVisible();
  await page.getByRole("button", { name: "Save finding and create investigation" }).click();
  await page.getByRole("button", { name: "Preview revised interpretation" }).click();
  await expect(page.getByText("Valid sanity-check result; unsuitable for direct baseline comparison.")).toBeVisible();
  await page.getByRole("button", { name: "Confirm challenge and revision" }).click();
  await page.getByRole("button", { name: "Draft matched reevaluation plan" }).click();
  await page.getByLabel("Batch size").fill("16");
  await expect(page.getByText("Batch size changed for operational fit; the comparison remains matched.")).toBeVisible();
  await expect(page.locator(".digest-line code")).not.toHaveText("Calculating…");
  await page.getByRole("button", { name: "Approve exact plan" }).click();
  await expect(page.getByText("Approved · plan v1")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exact version approved" })).toBeDisabled();
  await expect(page.getByLabel("Batch size")).toBeDisabled();
  await expect(page.getByText("no execution permission granted", { exact: false })).toBeVisible();
  expect(privateRequests).toEqual([]);
});
