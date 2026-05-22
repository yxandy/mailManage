import test from "node:test";
import assert from "node:assert/strict";

import {
  mapSmsBowerCountries,
  mapSmsBowerFrontendPrices,
  mapSmsBowerFrontendServices,
  mapSmsBowerPricesV3,
  mapSmsBowerPurchaseV2,
  mapSmsBowerServices,
} from "./transformers.ts";

test("SMS Bower 服务列表会被转换为前端选项", () => {
  const result = mapSmsBowerServices({
    status: "success",
    services: [
      { id: 1, code: "go", name: "Google" },
      { id: 2, code: "dr", name: "OpenAI" },
    ],
  });

  assert.deepEqual(result, [
    { id: 1, code: "go", name: "Google" },
    { id: 2, code: "dr", name: "OpenAI" },
  ]);
});

test("SMS Bower 前台服务列表会保留数字 ID 与购买代码", () => {
  const result = mapSmsBowerFrontendServices({
    services: {
      "4": { id: 4, title: "Instagram", activate_org_code: "ig" },
      "10": { id: 10, title: "Google", activate_org_code: "go" },
      bad: { title: "Broken" },
    },
  });

  assert.deepEqual(result, [
    { id: 10, code: "go", name: "Google" },
    { id: 4, code: "ig", name: "Instagram" },
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
      serviceId: 0,
      serviceCode: "dr",
      countryId: 16,
      countryCode: 16,
      countryName: "英格兰",
      countryType: "normal",
      providerId: "201",
      providerIds: "201",
      providerCount: 1,
      price: "0.0200",
      count: 8,
      rankId: null,
      rank: "未标注",
    },
    {
      id: "6:101:0.0450",
      serviceId: 0,
      serviceCode: "dr",
      countryId: 6,
      countryCode: 6,
      countryName: "印度尼西亚",
      countryType: "normal",
      providerId: "101",
      providerIds: "101",
      providerCount: 1,
      price: "0.0450",
      count: 3,
      rankId: null,
      rank: "未标注",
    },
  ]);
});

test("SMS Bower 前台价格会按官网档位聚合 provider 并过滤虚拟国家", () => {
  const result = mapSmsBowerFrontendPrices({
    serviceId: 4,
    serviceCode: "ig",
    minPrice: 0.01,
    maxPrice: 0.05,
    response: {
      services: {
        "4": {
          id: 4,
          title: "Instagram",
          activate_org_code: "ig",
          countries: {
            "352": {
              id: 352,
              title: "United States (virtual)",
              iso: "UV",
              activate_org_code: "12",
              positions: {
                "1|0.02": {
                  price: 0.02,
                  count: 5,
                  rank: { id: 1, description: "gold" },
                  agent_ids: [3379],
                  agent_prices: { "3379": 0.02 },
                },
                "3|0.08": {
                  price: 0.08,
                  count: 9,
                  rank: { id: 3, description: "bronze" },
                  agent_ids: [2579],
                  agent_prices: { "2579": 0.08 },
                },
              },
            },
            "6": {
              id: 6,
              title: "印度尼西亚",
              iso: "ID",
              activate_org_code: "6",
              positions: {
                "1|0.02": {
                  price: 0.02,
                  count: 5,
                  rank: { id: 1, description: "gold" },
                  agent_ids: [3379, 2579],
                  agent_prices: { "3379": 0.02, "2579": 0.02 },
                },
              },
            },
          },
        },
      },
    },
  });

  assert.deepEqual(result, [
    {
      id: "4:6:1|0.02:0.0200",
      serviceId: 4,
      serviceCode: "ig",
      countryId: 6,
      countryCode: 6,
      countryName: "印度尼西亚",
      countryType: "normal",
      providerId: "3379",
      providerIds: "3379,2579",
      providerCount: 2,
      price: "0.0200",
      count: 5,
      rankId: 1,
      rank: "黄金",
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
    countryPhoneCode: null,
    activationTime: "2026-05-22 10:00:00",
    activationOperator: "201",
    canGetAnotherSms: true,
  });
});
