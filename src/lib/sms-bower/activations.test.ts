import test from "node:test";
import assert from "node:assert/strict";

import { canCancelSmsBowerActivation } from "./activations.ts";

test("SMS Bower 未收到短信时允许取消", () => {
  assert.equal(
    canCancelSmsBowerActivation({
      activation_status: "STATUS_WAIT_CODE",
      sms_code: null,
      sms_text: null,
    }),
    true,
  );
});

test("SMS Bower 已收到验证码时不允许取消", () => {
  assert.equal(
    canCancelSmsBowerActivation({
      activation_status: "STATUS_WAIT_CODE",
      sms_code: "662090",
      sms_text: null,
    }),
    false,
  );
});

test("SMS Bower 已收到短信正文时不允许取消", () => {
  assert.equal(
    canCancelSmsBowerActivation({
      activation_status: "STATUS_WAIT_CODE",
      sms_code: null,
      sms_text: "Your code is 662090",
    }),
    false,
  );
});

test("SMS Bower 已是收到短信状态时不允许取消", () => {
  assert.equal(
    canCancelSmsBowerActivation({
      activation_status: "STATUS_OK",
      sms_code: null,
      sms_text: null,
    }),
    false,
  );
});
