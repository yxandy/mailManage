import type { Page } from "playwright";

import { IcloudAutomationError } from "./types.ts";

export type IcloudSessionState = {
  requiresInteraction: boolean;
  currentUrl: string;
};

type EnsureIcloudSessionOptions = {
  page: Page;
  allowManualLogin?: boolean;
  timeoutMs?: number;
  pollIntervalMs?: number;
};

const SIGN_IN_URL_KEYWORDS = ["signin.apple.com", "appleid.apple.com"];
const SIGN_IN_TEXT_PATTERNS = [
  /登录/i,
  /Sign In/i,
  /Apple Account/i,
  /双重认证/i,
  /双重验证/i,
  /Two-Factor/i,
  /verification code/i,
];
const DEFAULT_MANUAL_LOGIN_TIMEOUT_MS = 3 * 60 * 1000;
const DEFAULT_POLL_INTERVAL_MS = 1500;

async function getPageText(page: Page): Promise<string> {
  try {
    return await page.locator("body").innerText({ timeout: 2000 });
  } catch {
    return "";
  }
}

async function isLoginRequired(page: Page): Promise<boolean> {
  const currentUrl = page.url().toLowerCase();

  if (SIGN_IN_URL_KEYWORDS.some((keyword) => currentUrl.includes(keyword))) {
    return true;
  }

  const bodyText = await getPageText(page);

  return SIGN_IN_TEXT_PATTERNS.some((pattern) => pattern.test(bodyText));
}

export async function ensureIcloudSession({
  page,
  allowManualLogin = true,
  timeoutMs = DEFAULT_MANUAL_LOGIN_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: EnsureIcloudSessionOptions): Promise<IcloudSessionState> {
  const initialLoginRequired = await isLoginRequired(page);

  if (!initialLoginRequired) {
    return {
      requiresInteraction: false,
      currentUrl: page.url(),
    };
  }

  if (!allowManualLogin) {
    throw new IcloudAutomationError("AUTH_REQUIRED", "Apple 登录态失效，需要重新登录后再试");
  }

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await page.waitForTimeout(pollIntervalMs);

    if (!(await isLoginRequired(page))) {
      return {
        requiresInteraction: true,
        currentUrl: page.url(),
      };
    }
  }

  throw new IcloudAutomationError(
    "AUTH_REQUIRED",
    `Apple 登录超时，请在 ${Math.ceil(timeoutMs / 1000)} 秒内完成登录与双重验证后重试`,
  );
}
