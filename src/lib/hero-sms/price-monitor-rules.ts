import type { HeroSmsOfferView } from "./types";

export type HeroSmsPriceMonitorMatch = {
  matched: boolean;
  availableCount: number;
};

export function normalizeHeroSmsMonitorPrice(value: string | number): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error("请输入有效的正数价格");
  }

  return numericValue.toFixed(4);
}

export function getHeroSmsPriceMonitorOperatorName(input: {
  operatorCode: string;
  operatorName?: string;
}): string {
  const operatorCode = input.operatorCode.trim() || "any";
  const operatorName = input.operatorName?.trim();

  if (operatorName) {
    return operatorName;
  }

  return operatorCode === "any" ? "任意运营商" : operatorCode;
}

export function checkHeroSmsPriceMonitorMatch(input: {
  offer: HeroSmsOfferView | null;
  operatorCode: string;
  targetPrice: string | number;
}): HeroSmsPriceMonitorMatch {
  const targetPrice = normalizeHeroSmsMonitorPrice(input.targetPrice);
  const operatorCode = input.operatorCode.trim() || "any";
  const operator = input.offer?.operators.find((item) => item.code === operatorCode);
  const matchedTier = operator?.tierPrices.find((item) => item.price === targetPrice);
  const availableCount = matchedTier?.count ?? 0;

  return {
    matched: availableCount > 0,
    availableCount,
  };
}
