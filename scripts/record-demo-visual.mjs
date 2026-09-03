import { chromium } from "@playwright/test";
import { copyFile, mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://webmcp-research-auditor.vercel.app";
const outputDirectory = resolve("docs/demo-video-v2");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: outputDirectory, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
const video = page.video();

async function hold(milliseconds) {
  await page.waitForTimeout(milliseconds);
}

async function frame(locator, milliseconds = 3500) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((element) => {
    element.dataset.recordingOutline = element.style.outline;
    element.style.outline = "3px solid #ffc66d";
    element.style.outlineOffset = "5px";
  });
  await hold(milliseconds);
  await locator.evaluate((element) => {
    element.style.outline = element.dataset.recordingOutline ?? "";
    element.style.outlineOffset = "";
    delete element.dataset.recordingOutline;
  });
}

try {
  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await frame(page.getByRole("heading", { name: "Research Audit Workbench" }), 5500);
  await page.getByRole("link", { name: "Audit your own runs" }).click();
  await page.waitForURL(/\/login/);
  await hold(2500);

  const email = `video-${Date.now()}@example.test`;
  await page.getByLabel("Email").pressSequentially(email, { delay: 35 });
  await page.getByLabel("Password").pressSequentially("evidence-first-123", { delay: 45 });
  await hold(1500);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/workspace\/imports/);

  const sampleLink = page.getByRole("link", { name: /Metric-definition mismatch/ });
  await frame(sampleLink, 4500);
  const downloadPromise = page.waitForEvent("download");
  await sampleLink.click();
  const samplePath = await (await downloadPromise).path();
  if (!samplePath) throw new Error("Metric-definition sample download failed");
  await page.getByLabel("Select prepared ZIP").setInputFiles(samplePath);
  await hold(3000);
  await page.getByRole("button", { name: "Create review" }).click();
  const reviewHeading = page.getByRole("heading", { name: "Ranking aggregation comparison" });
  await reviewHeading.waitFor();
  await frame(reviewHeading, 5000);
  await frame(page.locator(".run-preview-grid"), 5000);
  await frame(page.locator(".digest-line"), 3500);

  await page.getByRole("button", { name: "Confirm reviewed import" }).click();
  await page.getByRole("heading", { name: "Two runs are now durable" }).waitFor();
  await hold(3500);
  await page.getByRole("link", { name: "Audit these runs" }).click();
  await page.getByRole("button", { name: "Run comparability audit" }).waitFor();
  await frame(page.locator(".comparison-panel"), 4000);

  await page.getByRole("button", { name: "Run comparability audit" }).click();
  const mismatch = page.getByRole("heading", { name: "Metric definitions differ" });
  await mismatch.waitFor();
  await frame(page.getByRole("heading", { name: "Candidate-pool sizes match" }), 2500);
  await frame(page.getByRole("heading", { name: "Evaluation split matches" }), 2500);
  await frame(mismatch, 6000);
  const mismatchCard = page.locator("article.finding").filter({ has: mismatch });
  await mismatchCard.getByRole("button", { name: /Inspect .* cited sources/ }).click();
  await frame(mismatchCard.locator(".evidence-grid"), 6500);

  await page.getByRole("button", { name: "Save complete audit and create investigation" }).click();
  const challenge = page.locator("#persistent-challenge");
  await challenge.waitFor();
  await frame(challenge.getByText("Action required"), 3500);
  await frame(challenge.locator(".sample-context-helper"), 5000);
  await page.getByLabel("Researcher context").press("Tab");
  await page.keyboard.press("Enter");
  await frame(page.getByLabel("Researcher context"), 4500);
  await page.getByRole("button", { name: "Preview my revised interpretation" }).click();
  await frame(challenge.locator(".challenge-diff"), 5500);
  await page.getByRole("button", { name: "Confirm challenge and revision" }).click();

  const plan = page.locator("#persistent-plan");
  await plan.waitFor();
  await frame(plan.getByRole("heading", { name: "Run A is prefilled to the Run B baseline" }), 4500);
  await frame(plan.locator(".plan-grid"), 6000);
  await page.getByLabel("Batch size").fill("16");
  await hold(2000);
  await page.getByRole("button", { name: "Save validated draft" }).click();
  await page.getByLabel("Approval rationale").waitFor();
  await frame(page.locator(".digest-line"), 4500);
  await frame(page.getByLabel("Approval rationale"), 4500);
  await page.getByRole("button", { name: "Approve exact plan" }).click();
  await page.waitForURL(/\/workspace\/investigations\/[0-9a-f-]+$/);
  await frame(page.getByText("AUTHORITATIVE · bound to plan v1"), 6500);
  await frame(page.getByText("No audit, agent action, or experiment execution resumes automatically."), 4500);
} finally {
  await context.close();
  await browser.close();
}

if (!video) throw new Error("Playwright did not create a video");
const recordedPath = await video.path();
const finalPath = resolve(outputDirectory, "research-audit-visual-silent.webm");
await copyFile(recordedPath, finalPath);
await unlink(recordedPath);
console.log(finalPath);
