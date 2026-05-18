import test from "node:test";
import assert from "node:assert/strict";

import { shouldFailNotificationEvent } from "./retry.ts";

test("提醒事件失败次数未达到上限时继续重试", () => {
  assert.equal(
    shouldFailNotificationEvent({
      attemptCountAfterFailure: 2,
      maxAttempts: 3,
    }),
    false,
  );
});

test("提醒事件失败次数达到上限时标记失败", () => {
  assert.equal(
    shouldFailNotificationEvent({
      attemptCountAfterFailure: 3,
      maxAttempts: 3,
    }),
    true,
  );
});
