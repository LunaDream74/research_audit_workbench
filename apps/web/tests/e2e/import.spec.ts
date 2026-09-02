import { expect, test } from "@playwright/test";
import { preparedPackageZip } from "./zip-fixture";

test("a researcher reviews, confirms, and privately returns to a prepared import", async ({ browser }) => {
  test.setTimeout(60_000);
  const owner = await browser.newContext();
  const page = await owner.newPage();
  const email = `importer-${Date.now()}@example.test`;
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
  await expect(page.getByText("File inventory · 10")).toBeVisible();
  await expect(page.getByText("The recorded candidate pools differ", { exact: false })).toBeVisible();
  await expect(page.getByText("Preview is stateless", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Confirm reviewed import" }).click();
  await expect(page.getByRole("heading", { name: "Two runs are now durable" })).toBeVisible();
  await page.getByRole("link", { name: "Continue to investigations" }).click();
  await expect(page.getByText("Rain retrieval comparison")).toBeVisible();
  await expect(page.getByText("Run A")).toBeVisible();
  await expect(page.getByText("Run B")).toBeVisible();

  await owner.close();
  const returning = await browser.newContext();
  const returningPage = await returning.newPage();
  await returningPage.goto("/workspace");
  await expect(returningPage).toHaveURL(/\/login$/);
  await returningPage.getByLabel("Email").fill(email);
  await returningPage.getByLabel("Password").fill(password);
  await returningPage.getByRole("button", { name: "Sign in" }).click();
  await expect(returningPage).toHaveURL(/\/workspace$/);
  await expect(returningPage.getByText("Rain retrieval comparison")).toBeVisible();

  const outsider = await browser.newContext();
  const outsiderPage = await outsider.newPage();
  await outsiderPage.goto("/login");
  await outsiderPage.getByLabel("Email").fill(`outsider-${Date.now()}@example.test`);
  await outsiderPage.getByLabel("Password").fill(password);
  await outsiderPage.getByRole("button", { name: "Create account" }).click();
  await expect(outsiderPage).toHaveURL(/\/workspace$/);
  await expect(outsiderPage.getByText("Rain retrieval comparison")).toHaveCount(0);
  await outsider.close();
  await returning.close();
});
