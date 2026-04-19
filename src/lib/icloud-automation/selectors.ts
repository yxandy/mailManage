export const ICLOUD_SELECTORS = {
  hideMyEmailEntry: [
    '[aria-label*="隐藏邮件地址"]',
    '[aria-label*="Hide My Email"]',
    'a[href*="hide-my-email"]',
    'button[aria-label*="隐藏邮件地址"]',
    'button[aria-label*="Hide My Email"]',
  ],
  createButton: [
    'button[aria-label*="创建"]',
    'button[aria-label*="新建"]',
    'button[aria-label*="Create"]',
    'button[aria-label*="New"]',
    'button:has-text("创建")',
    'button:has-text("新建")',
    'button:has-text("Create")',
    'button:has-text("New")',
  ],
  latestEmailText: [
    '[data-testid*="email"]',
    '[class*="email"]',
    'span:has-text("@privaterelay.appleid.com")',
    'div:has-text("@privaterelay.appleid.com")',
  ],
  emailPattern: /[A-Z0-9._%+-]+@privaterelay\.appleid\.com/i,
} as const;
