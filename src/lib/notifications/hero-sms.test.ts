import test from "node:test";
import assert from "node:assert/strict";

import { buildHeroSmsReceivedDedupeKey } from "./hero-sms-dedupe.ts";

test("HeroSMS 短信提醒优先用验证码生成去重键", () => {
  assert.equal(
    buildHeroSmsReceivedDedupeKey({
      activationId: "123",
      smsCode: "456789",
      smsText: "Your code is 456789",
    }),
    "hero-sms:sms-received:123:456789",
  );
});

test("HeroSMS 短信提醒没有验证码时用短信正文哈希生成去重键", () => {
  const first = buildHeroSmsReceivedDedupeKey({
    activationId: "123",
    smsCode: "",
    smsText: "Your code is 456789",
  });
  const second = buildHeroSmsReceivedDedupeKey({
    activationId: "123",
    smsCode: "",
    smsText: "Your code is 456789",
  });

  assert.equal(first, second);
  assert.match(first, /^hero-sms:sms-received:123:[a-f0-9]{16}$/);
});
