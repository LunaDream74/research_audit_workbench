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
  await expect(page.getByText("200 candidates")).toBeVisible();
  await expect(page.getByText("1,000 candidates")).toBeVisible();
  expect(privateRequests).toEqual([]);
});

