import test from "node:test";
import assert from "node:assert/strict";

import {
  extractDigitsFromSmsText,
  getHeroSmsCurrencyLabel,
  getHeroSmsStatusText,
  mapHeroSmsActivationRecordToView,
  mapHeroSmsFavoriteRecordToView,
} from "./activations.ts";

test("HeroSMS 币种代码会转换为展示文案", () => {
  assert.equal(getHeroSmsCurrencyLabel(840), "USD");
});

test("HeroSMS 有短信内容时状态优先显示收到短信", () => {
  assert.equal(getHeroSmsStatusText("4", "Your code is 12345"), "收到短信");
});

test("HeroSMS 活动记录会转换为前端视图", () => {
  const result = mapHeroSmsActivationRecordToView({
    id: "local-id",
    activation_id: "123",
    phone_number: "447000000000",
    service_code: "tg",
    service_name: "Telegram",
    country_id: 16,
    country_name: "英国",
    country_phone_code: 44,
    operator_code: "any",
    activation_cost: "0.02",
    currency_code: 840,
    can_get_another_sms: true,
    activation_time: "2026-05-16T12:00:00.000Z",
    activation_end_time: "2026-05-16T14:00:00.000Z",
    activation_status: "4",
    sms_code: null,
    sms_text: null,
    last_sms_code: null,
    last_sms_text: null,
    is_active: true,
    created_at: "2026-05-16T12:00:00.000Z",
    updated_at: "2026-05-16T12:00:00.000Z",
  });

  assert.deepEqual(result, {
    id: "local-id",
    activationId: "123",
    phoneNumber: "447000000000",
    serviceName: "Telegram",
    countryName: "英国",
    countryPhoneCode: 44,
    operatorCode: "any",
    activationCost: "0.02",
    currencyLabel: "USD",
    canGetAnotherSms: true,
    activationTime: "2026-05-16T12:00:00.000Z",
    activationEndTime: "2026-05-16T14:00:00.000Z",
    activationStatus: "4",
    activationStatusText: "等待接收短信",
    smsCode: null,
    smsText: null,
    lastSmsCode: null,
    lastSmsText: null,
    isActive: true,
    createdAt: "2026-05-16T12:00:00.000Z",
  });
});

test("HeroSMS 数字状态码也会映射为中文文案", () => {
  assert.equal(getHeroSmsStatusText("4", null), "等待接收短信");
  assert.equal(getHeroSmsStatusText("2", null), "收到短信");
});

test("HeroSMS 取消与完成状态会映射为中文文案", () => {
  assert.equal(getHeroSmsStatusText("8", null), "已取消");
  assert.equal(getHeroSmsStatusText("6", null), "已完成");
});

test("HeroSMS 再次接收状态会映射为等待再次短信", () => {
  assert.equal(getHeroSmsStatusText("3", null), "等待再次接收短信");
});

test("HeroSMS 短信内容可提取数字部分", () => {
  assert.equal(
    extractDigitsFromSmsText("Your verification code is 123456, valid for 10 minutes."),
    "123456 10",
  );
});

test("HeroSMS 收藏记录会转换为前端视图", () => {
  const result = mapHeroSmsFavoriteRecordToView({
    id: "fav-id",
    service_code: "tg",
    service_name: "Telegram",
    country_id: 16,
    country_name: "英国",
    operator_code: "any",
    deleted_at: null,
    created_at: "2026-05-16T12:00:00.000Z",
    updated_at: "2026-05-16T12:00:00.000Z",
  });

  assert.deepEqual(result, {
    id: "fav-id",
    serviceCode: "tg",
    serviceName: "Telegram",
    countryId: 16,
    countryName: "英国",
    operatorCode: "any",
  });
});
