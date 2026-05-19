import type { HeroSmsActivationHistoryRawItem } from "./types";

export type HeroSmsActivationHistoryInput = {
  activationId: string;
  activationDate: string | null;
  phoneNumber: string;
  activationCost: string | null;
  currencyCode: number | null;
  serviceCode: string | null;
  serviceName: string | null;
  countryId: number | null;
  countryName: string | null;
  operatorCode: string | null;
  activationStatus: string | null;
  smsText: string | null;
  rawPayload: HeroSmsActivationHistoryRawItem;
};

function getStringValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    const normalized = String(value).trim();

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function getNumberValue(...values: unknown[]): number | null {
  for (const value of values) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    const normalized = Number(value);

    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function normalizeHeroSmsActivationHistoryItem(
  item: HeroSmsActivationHistoryRawItem,
): HeroSmsActivationHistoryInput | null {
  const activationId = getStringValue(item.id, item.activationId);
  const phoneNumber = getStringValue(item.phone, item.phoneNumber);

  if (!activationId || !phoneNumber) {
    return null;
  }

  const activationCost = getStringValue(item.cost, item.activationCost);

  return {
    activationId,
    activationDate: getStringValue(item.date),
    phoneNumber,
    activationCost,
    currencyCode: getNumberValue(item.currency),
    serviceCode: getStringValue(item.serviceCode, item.service),
    serviceName: getStringValue(item.serviceName),
    countryId: getNumberValue(item.countryCode, item.country),
    countryName: getStringValue(item.countryName),
    operatorCode: getStringValue(item.activationOperator, item.operator),
    activationStatus: getStringValue(item.status, item.activationStatus),
    smsText: getStringValue(item.sms, item.smsText),
    rawPayload: item,
  };
}

export function isSuccessfulHeroSmsActivationHistoryItem(
  item: HeroSmsActivationHistoryInput,
): boolean {
  const normalizedStatus = item.activationStatus?.trim().toLowerCase() ?? "";

  return normalizedStatus === "6" || normalizedStatus === "success" || Boolean(item.smsText);
}
