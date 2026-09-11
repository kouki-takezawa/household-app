import type { Page } from "@playwright/test";

export const PASSCODE = "0607";

export async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[type="password"]').fill(PASSCODE);
  await page.keyboard.press("Enter");
  await page.waitForURL("/");
}

/** テストごとに一意な文字列（メモ等に混ぜて、他テストのデータと区別するために使う） */
export function uniqueTag(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
