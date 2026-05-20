import test from "node:test";
import assert from "node:assert/strict";

import {
  mapHeroSmsCountries,
  mapHeroSmsOffer,
  mapHeroSmsOperators,
  mapHeroSmsServices,
  mapHeroSmsWebOffer,
  parseHeroSmsBalance,
} from "./transformers.ts";

test("HeroSMS 余额保留原始精度", () => {
  const result = parseHeroSmsBalance("ACCESS_BALANCE:100.5001");

  assert.deepEqual(result, {
    balance: "100.5001",
  });
});

test("HeroSMS 服务列表会被转换为前端选项", () => {
  const result = mapHeroSmsServices({
    status: "success",
    services: [
      { code: "tg", name: "Telegram" },
      { code: "wa", name: "WhatsApp" },
    ],
  });

  assert.deepEqual(result, [
    { code: "tg", name: "Telegram" },
    { code: "wa", name: "WhatsApp" },
  ]);
});

test("HeroSMS 国家列表只保留可见国家并优先使用中文名称", () => {
  const result = mapHeroSmsCountries({
    "6": { chn: "印度尼西亚", eng: "Indonesia", visible: 1 },
    "48": { chn: "波兰", eng: "Poland", visible: 1 },
    "99": { chn: "隐藏国家", eng: "Hidden", visible: 0 },
  });

  assert.deepEqual(result, [
    { id: 48, name: "波兰" },
    { id: 6, name: "印度尼西亚" },
  ]);
});

test("HeroSMS offers 可解析最低个人价与库存", () => {
  const result = mapHeroSmsOffer(
    {
      data: {
        tg: {
          "6": {
            prices: {
              min: 0.15,
              default: 0.15,
            },
            counts: {
              total: 22598,
              physical: 12352,
              defaultPrice: 4787,
            },
            map: {
              "0.1500": 14460,
              "0.1553": 28887,
              "0.6143": 670031,
            },
          },
        },
      },
    },
    "tg",
    6,
  );

  assert.deepEqual(result, {
    service: "tg",
    country: 6,
    minPrice: "0.15",
    defaultPrice: "0.15",
    tierMinPrice: "0.15",
    tierPrices: [
      { price: "0.1500", count: 14460 },
      { price: "0.1553", count: 28887 },
      { price: "0.6143", count: 670031 },
    ],
    totalCount: 22598,
    physicalCount: 12352,
    defaultPriceCount: 4787,
    operators: [],
  });
});

test("HeroSMS offers 不存在组合时返回空", () => {
  const result = mapHeroSmsOffer({ data: {} }, "tg", 6);

  assert.equal(result, null);
});

test("HeroSMS 网页端 offers 可按运营商解析价格档位", () => {
  const result = mapHeroSmsWebOffer(
    {
      data: {
        dr: {
          userPrice: 0.05,
          activationFinishTime: 20,
          operators: [
            {
              name: "any",
              localName: "任何操作员",
              activationsCount: 494,
              countPhysical: 494,
              freePriceOffers: {
                "0.0500": 9,
                "0.5711": 365,
                "0.5883": 494,
              },
            },
            {
              name: "vinaphone",
              localName: "維納電話",
              activationsCount: 484,
              countPhysical: 484,
              freePriceOffers: {
                "0.5711": 356,
                "0.5883": 484,
              },
            },
          ],
        },
      },
    },
    "dr",
    10,
  );

  assert.deepEqual(result, {
    service: "dr",
    country: 10,
    minPrice: "0.05",
    defaultPrice: "0.05",
    tierMinPrice: "0.0500",
    tierPrices: [
      { price: "0.0500", count: 9 },
      { price: "0.5711", count: 365 },
      { price: "0.5883", count: 494 },
    ],
    totalCount: 494,
    physicalCount: 494,
    defaultPriceCount: 9,
    operators: [
      {
        code: "any",
        name: "任何操作员",
        totalCount: 494,
        physicalCount: 494,
        personalMinCount: 9,
        tierPrices: [
          { price: "0.0500", count: 9 },
          { price: "0.5711", count: 365 },
          { price: "0.5883", count: 494 },
        ],
      },
      {
        code: "vinaphone",
        name: "維納電話",
        totalCount: 484,
        physicalCount: 484,
        personalMinCount: 0,
        tierPrices: [
          { price: "0.5711", count: 356 },
          { price: "0.5883", count: 484 },
        ],
      },
    ],
  });
});

test("HeroSMS 运营商列表会按国家转换为前端选项", () => {
  const result = mapHeroSmsOperators(
    {
      status: "success",
      countryOperators: {
        "175": ["optus", "vodafone", "telstra"],
      },
    },
    175,
  );

  assert.deepEqual(result, [
    { code: "optus", name: "optus" },
    { code: "telstra", name: "telstra" },
    { code: "vodafone", name: "vodafone" },
  ]);
});
