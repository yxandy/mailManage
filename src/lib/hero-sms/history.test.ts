import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHeroSmsActivationHistoryFromRecord,
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

test("HeroSMS 当前活动收到短信时会生成完整历史记录字段", () => {
  const result = buildHeroSmsActivationHistoryFromRecord({
    record: {
      id: "local-id",
      activation_id: "396547976",
      phone_number: "6283846044549",
      service_code: "ni",
      service_name: "Gojek",
      country_id: 6,
      country_name: "印度尼西亚",
      country_phone_code: 62,
      operator_code: "any",
      activation_cost: "0.045",
      currency_code: 840,
      can_get_another_sms: true,
      activation_time: "2026-05-19T15:00:00.000Z",
      activation_end_time: "2026-05-19T17:00:00.000Z",
      activation_status: "2",
      sms_code: "418868",
      sms_text: "OTP: 418868",
      last_sms_code: null,
      last_sms_text: null,
      is_active: true,
      created_at: "2026-05-19T15:00:00.000Z",
      updated_at: "2026-05-19T15:34:48.000Z",
    },
    smsCode: "418868",
    smsText: "OTP: 418868",
    receivedAt: "2026-05-19T15:34:48.775646+00:00",
  });

  assert.equal(result.activationId, "396547976");
  assert.equal(result.phoneNumber, "6283846044549");
  assert.equal(result.activationCost, "0.045");
  assert.equal(result.currencyCode, 840);
  assert.equal(result.serviceCode, "ni");
  assert.equal(result.serviceName, "Gojek");
  assert.equal(result.countryId, 6);
  assert.equal(result.countryName, "印度尼西亚");
  assert.equal(result.operatorCode, "any");
  assert.equal(result.activationStatus, "6");
  assert.equal(result.smsText, "OTP: 418868");
  assert.equal(result.rawPayload.smsCode, "418868");
});
