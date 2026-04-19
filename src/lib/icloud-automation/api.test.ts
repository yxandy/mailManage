import test from "node:test";
import assert from "node:assert/strict";

import { IcloudAutomationError } from "./types.ts";
import { createIcloudHideEmailRecord } from "./api.ts";

test("未登录时返回 401", async () => {
  const result = await createIcloudHideEmailRecord({
    getCurrentSession: async () => null,
    createOneHideMyEmail: async () => {
      throw new Error("不应执行到这里");
    },
    createEmailAccountAndReturnId: async () => {
      throw new Error("不应执行到这里");
    },
  });

  assert.equal(result.status, 401);
  assert.equal(result.body.error, "未登录或登录已失效");
});

test("创建成功时写入邮箱并返回记录 ID", async () => {
  const result = await createIcloudHideEmailRecord({
    getCurrentSession: async () => ({
      username: "admin",
      expiresAt: new Date("2099-01-01T00:00:00.000Z").toISOString(),
    }),
    createOneHideMyEmail: async () => ({
      email: "new@privaterelay.appleid.com",
      requiresInteraction: true,
    }),
    createEmailAccountAndReturnId: async (input) => {
      assert.deepEqual(input, {
        email_name: "new@privaterelay.appleid.com",
        source: "icloud_hide_my_email",
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
      });

      return "record-1";
    },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, {
    success: true,
    email: "new@privaterelay.appleid.com",
    recordId: "record-1",
    requiresInteraction: true,
  });
});

test("自动化抛出结构化错误时返回对应错误码", async () => {
  const result = await createIcloudHideEmailRecord({
    getCurrentSession: async () => ({
      username: "admin",
      expiresAt: new Date("2099-01-01T00:00:00.000Z").toISOString(),
    }),
    createOneHideMyEmail: async () => {
      throw new IcloudAutomationError("AUTH_REQUIRED", "需要重新登录 Apple 账号");
    },
    createEmailAccountAndReturnId: async () => {
      throw new Error("不应执行到这里");
    },
  });

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    error: "需要重新登录 Apple 账号",
    code: "AUTH_REQUIRED",
  });
});
