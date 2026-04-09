import test from "node:test";
import assert from "node:assert/strict";

import { getEmailNameColorClass } from "./status.ts";
import type { EmailAccountRecord } from "./schema.ts";

function createRecord(overrides: Partial<EmailAccountRecord> = {}): EmailAccountRecord {
  return {
    id: "test-id",
    email_name: "demo@gmail.com",
    user_name: null,
    birthday: null,
    registered_at: null,
    registered_location: null,
    is_registered_cg: false,
    cg_registered_at: null,
    is_linked_s2a: false,
    linked_at: null,
    is_expired: false,
    expired_at: null,
    deleted_at: null,
    created_at: "2026-04-09T00:00:00.000Z",
    updated_at: "2026-04-09T00:00:00.000Z",
    ...overrides,
  };
}

test("已失效邮箱显示红色", () => {
  assert.equal(
    getEmailNameColorClass(
      createRecord({
        is_expired: true,
        expired_at: "2026-04-09T00:00:00.000Z",
        is_linked_s2a: true,
        linked_at: "2026-04-08T00:00:00.000Z",
      }),
    ),
    "text-[var(--email-status-expired)]",
  );
});

test("未失效且已关联 s2a 的邮箱显示绿色", () => {
  assert.equal(
    getEmailNameColorClass(
      createRecord({
        is_linked_s2a: true,
        linked_at: "2026-04-08T00:00:00.000Z",
      }),
    ),
    "text-[var(--email-status-linked)]",
  );
});

test("普通注册时间和 cg 注册时间同时存在时显示黄色", () => {
  assert.equal(
    getEmailNameColorClass(
      createRecord({
        registered_at: "2026-04-06T00:00:00.000Z",
        is_registered_cg: true,
        cg_registered_at: "2026-04-07T00:00:00.000Z",
      }),
    ),
    "text-[var(--email-status-registered-cg)]",
  );
});

test("只有普通注册时间时显示橙色", () => {
  assert.equal(
    getEmailNameColorClass(
      createRecord({
        registered_at: "2026-04-06T00:00:00.000Z",
      }),
    ),
    "text-[var(--email-status-registered)]",
  );
});

test("没有注册时间且未关联未失效时保留默认颜色", () => {
  assert.equal(getEmailNameColorClass(createRecord()), "text-[var(--email-status-default)]");
});
