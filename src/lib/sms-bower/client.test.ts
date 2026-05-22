import test from "node:test";
import assert from "node:assert/strict";

import {
  mapSmsBowerCountries,
  mapSmsBowerPricesV3,
  mapSmsBowerPurchaseV2,
  mapSmsBowerServices,
} from "./transformers.ts";

test("SMS Bower 服务列表会被转换为前端选项", () => {
  const result = mapSmsBowerServices({
    status: "success",
    services: [
      { code: "go", name: "Google" },
      { code: "dr", name: "OpenAI" },
    ],
  });

  assert.deepEqual(result, [
    { code: "go", name: "Google" },
    { code: "dr", name: "OpenAI" },
  ]);
});

test("SMS Bower 国家列表只保留可见国家并优先使用中文名", () => {
  const result = mapSmsBowerCountries({
    "6": { chn: "印度尼西亚", eng: "Indonesia", visible: 1 },
    "16": { chn: "英格兰", eng: "England", visible: 1 },
    "99": { chn: "隐藏", eng: "Hidden", visible: 0 },
  });

  assert.deepEqual(result, [
    { id: 6, name: "印度尼西亚" },
    { id: 16, name: "英格兰" },
  ]);
});

test("SMS Bower V3 价格会筛出指定服务与价格区间的国家", () => {
  const result = mapSmsBowerPricesV3({
    serviceCode: "dr",
    minPrice: 0.02,
    maxPrice: 0.05,
    countries: [
      { id: 6, name: "印度尼西亚" },
      { id: 16, name: "英格兰" },
    ],
    response: {
      "6": {
        dr: {
          "101": { count: 3, price: 0.045, provider_id: 101 },
          "102": { count: 0, price: 0.03, provider_id: 102 },
        },
      },
      "16": {
        dr: {
          "201": { count: 8, price: 0.02, provider_id: 201 },
          "202": { count: 5, price: 0.08, provider_id: 202 },
        },
      },
    },
  });

  assert.deepEqual(result, [
    {
      id: "16:201:0.0200",
      serviceCode: "dr",
      countryId: 16,
      countryName: "英格兰",
      providerId: "201",
      price: "0.0200",
      count: 8,
    },
    {
      id: "6:101:0.0450",
      serviceCode: "dr",
      countryId: 6,
      countryName: "印度尼西亚",
      providerId: "101",
      price: "0.0450",
      count: 3,
    },
  ]);
});

test("SMS Bower V2 购买结果会转换为前端展示字段", () => {
  const result = mapSmsBowerPurchaseV2({
    activationId: 123,
    phoneNumber: "441234567890",
    activationCost: 0.045,
    countryCode: 16,
    activationTime: "2026-05-22 10:00:00",
    activationOperator: "201",
    canGetAnotherSms: true,
  });

  assert.deepEqual(result, {
    activationId: "123",
    phoneNumber: "441234567890",
    activationCost: "0.0450",
    countryCode: 16,
    activationTime: "2026-05-22 10:00:00",
    activationOperator: "201",
    canGetAnotherSms: true,
  });
});
