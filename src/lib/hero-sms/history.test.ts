import test from "node:test";
import assert from "node:assert/strict";

import {
  isSuccessfulHeroSmsActivationHistoryItem,
  normalizeHeroSmsActivationHistoryItem,
} from "./history.ts";

test("HeroSMS 历史记录会归一化成功激活分析字段", () => {
  const result = normalizeHeroSmsActivationHistoryItem({
    id: "635468024",
    date: "2026-05-18 10:00:00",
    phone: "447000000000",
    sms: "Your code is 123456",
    cost: 0.02,
    status: "6",
    currency: 840,
    serviceCode: "dr",
    serviceName: "OpenAI",
    countryCode: 16,
    countryName: "英国",
    activationOperator: "three",
  });

  assert.deepEqual(result, {
    activationId: "635468024",
    activationDate: "2026-05-18 10:00:00",
    phoneNumber: "447000000000",
    activationCost: "0.02",
    currencyCode: 840,
    serviceCode: "dr",
    serviceName: "OpenAI",
    countryId: 16,
    countryName: "英国",
    operatorCode: "three",
    activationStatus: "6",
    smsText: "Your code is 123456",
    rawPayload: {
      id: "635468024",
      date: "2026-05-18 10:00:00",
      phone: "447000000000",
      sms: "Your code is 123456",
      cost: 0.02,
      status: "6",
      currency: 840,
      serviceCode: "dr",
      serviceName: "OpenAI",
      countryCode: 16,
      countryName: "英国",
      activationOperator: "three",
    },
  });
  assert.equal(result ? isSuccessfulHeroSmsActivationHistoryItem(result) : false, true);
});

test("HeroSMS 历史记录缺少核心字段时不入库", () => {
  assert.equal(normalizeHeroSmsActivationHistoryItem({ id: "1" }), null);
  assert.equal(normalizeHeroSmsActivationHistoryItem({ phone: "447000000000" }), null);
});
