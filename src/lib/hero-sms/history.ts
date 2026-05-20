import type { HeroSmsActivationHistoryRawItem, HeroSmsActivationRecord } from "./types";

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

  return (
    normalizedStatus === "6" ||
    normalizedStatus === "success" ||
    Boolean(item.smsText) ||
    Boolean((item.rawPayload as { smsCode?: unknown }).smsCode)
  );
}

export function buildHeroSmsActivationHistoryFromRecord(input: {
  record: HeroSmsActivationRecord;
  smsCode: string | null;
  smsText: string | null;
  receivedAt?: string | null;
  rawPayload?: HeroSmsActivationHistoryRawItem;
}): HeroSmsActivationHistoryInput {
  const smsCode = input.smsCode?.trim() ?? "";
  const smsText = input.smsText?.trim() ?? "";
  const receivedAt = input.receivedAt?.trim() || new Date().toISOString();

  return {
    activationId: input.record.activation_id,
    activationDate: receivedAt,
    phoneNumber: input.record.phone_number,
    activationCost: String(input.record.activation_cost),
    currencyCode: input.record.currency_code,
    serviceCode: input.record.service_code,
    serviceName: input.record.service_name,
    countryId: input.record.country_id,
    countryName: input.record.country_name,
    operatorCode: input.record.operator_code,
    activationStatus: "6",
    smsText: smsText || smsCode || null,
    rawPayload:
      input.rawPayload ?? {
        activationId: input.record.activation_id,
        date: receivedAt,
        phone: input.record.phone_number,
        sms: smsText || null,
        smsCode: smsCode || null,
        cost: input.record.activation_cost,
        status: "6",
        currency: input.record.currency_code,
        serviceCode: input.record.service_code,
        serviceName: input.record.service_name,
        countryCode: input.record.country_id,
        countryName: input.record.country_name,
        activationOperator: input.record.operator_code,
      },
  };
}
