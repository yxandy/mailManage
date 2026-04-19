import test from "node:test";
import assert from "node:assert/strict";

import { IcloudAutomationError, type IcloudAutomationClient } from "./types.ts";
import { createOneHideMyEmail } from "./service.ts";

test("createOneHideMyEmail 返回创建结果结构", async () => {
  const client: IcloudAutomationClient = {
    async createHideMyEmail() {
      return {
        email: "demo@privaterelay.appleid.com",
        requiresInteraction: false,
      };
    },
  };

  const result = await createOneHideMyEmail({ client });

  assert.deepEqual(result, {
    email: "demo@privaterelay.appleid.com",
    requiresInteraction: false,
  });
});

test("createOneHideMyEmail 透传结构化错误码", async () => {
  const client: IcloudAutomationClient = {
    async createHideMyEmail() {
      throw new IcloudAutomationError("AUTH_REQUIRED", "需要重新登录 Apple 账号");
    },
  };

  await assert.rejects(
    () => createOneHideMyEmail({ client }),
    (error: unknown) => {
      assert.ok(error instanceof IcloudAutomationError);
      assert.equal(error.code, "AUTH_REQUIRED");
      return true;
    },
  );
});
