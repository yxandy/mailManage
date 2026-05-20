import test from "node:test";
import assert from "node:assert/strict";

import {
  checkHeroSmsPriceMonitorMatch,
  normalizeHeroSmsMonitorPrice,
} from "./price-monitor-rules.ts";
import type { HeroSmsOfferView } from "./types.ts";

const offer: HeroSmsOfferView = {
  service: "dr",
  country: 10,
  minPrice: "0.0500",
  defaultPrice: "0.0500",
  tierMinPrice: "0.0500",
  tierPrices: [
    { price: "0.0500", count: 61 },
    { price: "0.2722", count: 369 },
  ],
  totalCount: 602,
  physicalCount: 602,
  defaultPriceCount: 61,
  operators: [
    {
      code: "any",
      name: "任何操作员",
      totalCount: 602,
      physicalCount: 602,
      personalMinCount: 61,
      tierPrices: [
        { price: "0.0500", count: 61 },
        { price: "0.2722", count: 369 },
      ],
    },
    {
      code: "vinaphone",
      name: "維納電話",
      totalCount: 537,
      physicalCount: 537,
      personalMinCount: 0,
      tierPrices: [{ price: "0.2722", count: 304 }],
    },
    {
      code: "empty",
      name: "空库存",
      totalCount: 0,
      physicalCount: 0,
      personalMinCount: 0,
      tierPrices: [{ price: "0.0500", count: 0 }],
    },
  ],
};

test("HeroSMS 价格监控会把目标价格归一化为 4 位小数", () => {
  assert.equal(normalizeHeroSmsMonitorPrice("0.05"), "0.0500");
  assert.equal(normalizeHeroSmsMonitorPrice("0.2722"), "0.2722");
});

test("HeroSMS 价格监控命中任意运营商报价", () => {
  assert.deepEqual(
    checkHeroSmsPriceMonitorMatch({
      offer,
      operatorCode: "any",
      targetPrice: "0.05",
    }),
    {
      matched: true,
      availableCount: 61,
    },
  );
});

test("HeroSMS 价格监控只匹配指定运营商报价", () => {
  assert.deepEqual(
    checkHeroSmsPriceMonitorMatch({
      offer,
      operatorCode: "vinaphone",
      targetPrice: "0.05",
    }),
    {
      matched: false,
      availableCount: 0,
    },
  );
});

test("HeroSMS 价格监控库存为 0 时不命中", () => {
  assert.deepEqual(
    checkHeroSmsPriceMonitorMatch({
      offer,
      operatorCode: "empty",
      targetPrice: "0.05",
    }),
    {
      matched: false,
      availableCount: 0,
    },
  );
});
