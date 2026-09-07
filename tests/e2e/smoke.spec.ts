import { expect, test } from "@playwright/test";

test("landing page shows HomeSpace brand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("HomeSpace").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create account" }),
  ).toBeVisible();
});

test("demo user can sign in and open dashboard", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("demo@homespace.app");
  await page.getByLabel("Password").fill("demopassword");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("12 Example Road").first()).toBeVisible();
});

test("unauthenticated users are redirected from properties", async ({
  page,
}) => {
  await page.goto("/properties");
  await expect(page).toHaveURL(/sign-in/);
});
