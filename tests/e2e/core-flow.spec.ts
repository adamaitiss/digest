import { expect, test } from "@playwright/test";

test("mobile training, digest, saved, and profile flow render", async ({ page }) => {
  await page.goto("/digest/");

  await expect(page.getByRole("heading", { name: "Train" })).toBeVisible();
  await expect(page.getByText(/Fed signals caution/)).toBeVisible();
  await page.getByRole("button", { name: /Like/ }).click();
  await expect(page.getByText(/EU adopts AI Act/)).toBeVisible();

  await page.getByRole("button", { name: "Digest" }).click();
  await expect(page.getByRole("heading", { name: "Digest" })).toBeVisible();
  await expect(page.getByText("Markets and Policy")).toBeVisible();
  await page.getByText(/Fed signals caution/).first().click();
  await expect(page.getByText("Why selected")).toBeVisible();
  await page.getByRole("button", { name: "Useful" }).click();

  await page.getByRole("button", { name: "Saved" }).click();
  await expect(page.getByPlaceholder("Search saved items")).toBeVisible();
  await expect(page.getByText(/saved items/)).toBeVisible();

  await page.getByRole("button", { name: "Profile" }).click();
  await expect(page.getByText("Interest description")).toBeVisible();
  await expect(page.getByText("Source health")).toBeVisible();
});

test("PWA manifest is reachable", async ({ page, request }) => {
  await page.goto("/digest/");
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();
  const response = await request.get(manifestHref!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toContain("Personal News Swipe Digest");
  expect(manifest.display).toBe("standalone");
});

