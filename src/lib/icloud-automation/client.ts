import { mkdirSync } from "node:fs";
import path from "node:path";
import type { BrowserContext, BrowserType, Page } from "playwright";

import { ICLOUD_SELECTORS } from "./selectors.ts";
import { ensureIcloudSession } from "./session.ts";
import { IcloudAutomationError } from "./types.ts";
import type { CreateHideMyEmailResult, IcloudAutomationClient } from "./types.ts";

const DEFAULT_GOTO_TIMEOUT_MS = 60_000;
const DEFAULT_CREATE_WAIT_MS = 2_000;
const DEFAULT_MANUAL_LOGIN_TIMEOUT_MS = 3 * 60 * 1000;
const DEFAULT_USER_DATA_DIR = path.resolve(process.cwd(), ".local/icloud-playwright");
const ICLOUD_HOME_URL = "https://www.icloud.com/";
const ICLOUD_PLUS_URL = "https://www.icloud.com/icloudplus/";

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "1" || normalized === "true" || normalized === "yes") {
    return true;
  }

  if (normalized === "0" || normalized === "false" || normalized === "no") {
    return false;
  }

  return fallback;
}

function parseNumberEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function resolveUserDataDir(): string {
  return process.env.ICLOUD_PLAYWRIGHT_USER_DATA_DIR?.trim() || DEFAULT_USER_DATA_DIR;
}

function extractEmailFromText(text: string): string | null {
  const matched = text.match(ICLOUD_SELECTORS.emailPattern);

  return matched?.[0]?.toLowerCase() ?? null;
}

async function clickFirstVisibleBySelectors(page: Page, selectors: readonly string[]) {
  for (const selector of selectors) {
    const target = page.locator(selector).first();

    try {
      await target.waitFor({ state: "visible", timeout: 2500 });
      await target.click();
      return true;
    } catch {
      // 尝试下一个选择器
    }
  }

  return false;
}

async function clickByRoleName(
  page: Page,
  role: "button" | "link",
  namePattern: RegExp,
): Promise<boolean> {
  const target = page.getByRole(role, { name: namePattern }).first();

  try {
    await target.waitFor({ state: "visible", timeout: 2500 });
    await target.click();
    return true;
  } catch {
    return false;
  }
}

async function openHideMyEmailPage(page: Page) {
  await page.goto(ICLOUD_PLUS_URL, {
    waitUntil: "domcontentloaded",
    timeout: DEFAULT_GOTO_TIMEOUT_MS,
  });

  const clickedBySelector = await clickFirstVisibleBySelectors(page, ICLOUD_SELECTORS.hideMyEmailEntry);
  if (clickedBySelector) {
    return;
  }

  const clickedByText =
    (await clickByRoleName(page, "link", /隐藏邮件地址|Hide My Email/i)) ||
    (await clickByRoleName(page, "button", /隐藏邮件地址|Hide My Email/i));
  if (clickedByText) {
    return;
  }
}

async function createHideMyEmailAddress(page: Page) {
  const clickedBySelector = await clickFirstVisibleBySelectors(page, ICLOUD_SELECTORS.createButton);
  if (clickedBySelector) {
    await page.waitForTimeout(DEFAULT_CREATE_WAIT_MS);
    return;
  }

  const clickedByText =
    (await clickByRoleName(page, "button", /创建|新建|Create|New/i)) ||
    (await clickByRoleName(page, "link", /创建|新建|Create|New/i));

  if (!clickedByText) {
    throw new IcloudAutomationError("PAGE_CHANGED", "未找到“创建隐藏邮箱”入口，页面结构可能已变化");
  }

  await page.waitForTimeout(DEFAULT_CREATE_WAIT_MS);
}

async function readLatestHideMyEmailAddress(page: Page): Promise<string> {
  for (const selector of ICLOUD_SELECTORS.latestEmailText) {
    try {
      const text = await page.locator(selector).first().innerText({ timeout: 3000 });
      const email = extractEmailFromText(text);

      if (email) {
        return email;
      }
    } catch {
      // 尝试下一个候选选择器
    }
  }

  const fallbackText = await page.locator("body").innerText({ timeout: 5000 });
  const email = extractEmailFromText(fallbackText);

  if (email) {
    return email;
  }

  throw new IcloudAutomationError("READ_FAILED", "创建成功但未能读取到隐藏邮箱地址");
}

function mapUnknownError(error: unknown): IcloudAutomationError {
  if (error instanceof IcloudAutomationError) {
    return error;
  }

  if (error instanceof Error) {
    if (/timed out|timeout/i.test(error.message)) {
      return new IcloudAutomationError("PAGE_CHANGED", `页面加载或元素等待超时：${error.message}`);
    }

    return new IcloudAutomationError("CREATE_FAILED", error.message);
  }

  return new IcloudAutomationError("CREATE_FAILED", "创建 iCloud 隐藏邮箱失败");
}

async function launchPersistentContext(): Promise<BrowserContext> {
  let chromium: BrowserType;

  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    throw new IcloudAutomationError(
      "ENV_MISCONFIGURED",
      error instanceof Error
        ? `未检测到 Playwright 运行环境：${error.message}`
        : "未检测到 Playwright 运行环境",
    );
  }

  const userDataDir = resolveUserDataDir();
  mkdirSync(userDataDir, { recursive: true });

  const headless = parseBooleanEnv(process.env.ICLOUD_PLAYWRIGHT_HEADLESS, false);

  return chromium.launchPersistentContext(userDataDir, {
    headless,
    viewport: { width: 1440, height: 900 },
  });
}

export function createIcloudAutomationClient(): IcloudAutomationClient {
  return {
    async createHideMyEmail(): Promise<CreateHideMyEmailResult> {
      const context = await launchPersistentContext();
      const page = context.pages()[0] ?? (await context.newPage());

      try {
        await page.goto(ICLOUD_HOME_URL, {
          waitUntil: "domcontentloaded",
          timeout: DEFAULT_GOTO_TIMEOUT_MS,
        });

        const sessionState = await ensureIcloudSession({
          page,
          allowManualLogin: true,
          timeoutMs: parseNumberEnv(
            process.env.ICLOUD_MANUAL_LOGIN_TIMEOUT_MS,
            DEFAULT_MANUAL_LOGIN_TIMEOUT_MS,
          ),
        });

        await openHideMyEmailPage(page);
        await createHideMyEmailAddress(page);
        const email = await readLatestHideMyEmailAddress(page);

        return {
          email,
          requiresInteraction: sessionState.requiresInteraction,
        };
      } catch (error) {
        throw mapUnknownError(error);
      } finally {
        await context.close();
      }
    },
  };
}
