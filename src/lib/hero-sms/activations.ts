import type {
  HeroSmsActivationRecord,
  HeroSmsActivationView,
  HeroSmsFavoriteRecord,
  HeroSmsFavoriteView,
} from "./types";

const HERO_SMS_CURRENCY_LABELS: Record<number, string> = {
  840: "USD",
};

const HERO_SMS_STATUS_LABELS: Record<string, string> = {
  "1": "等待短信",
  "2": "等待短信",
  "3": "等待再次短信",
  "4": "已收到短信",
  "6": "已完成",
  "8": "已取消",
};

export function getHeroSmsCurrencyLabel(code: number): string {
  return HERO_SMS_CURRENCY_LABELS[code] ?? `货币代码 ${code}`;
}

export function getHeroSmsStatusText(status: string | null, smsText: string | null): string {
  if (smsText?.trim()) {
    return "已收到短信";
  }

  if (!status) {
    return "等待短信";
  }

  return HERO_SMS_STATUS_LABELS[status] ?? `状态 ${status}`;
}

export function extractDigitsFromSmsText(smsText: string): string {
  const groups = smsText.match(/\d+/g);

  if (!groups || groups.length === 0) {
    return "";
  }

  return groups.join(" ");
}

export function mapHeroSmsActivationRecordToView(
  record: HeroSmsActivationRecord,
): HeroSmsActivationView {
  return {
    id: record.id,
    activationId: record.activation_id,
    phoneNumber: record.phone_number,
    serviceName: record.service_name,
    countryName: record.country_name,
    countryPhoneCode: record.country_phone_code,
    operatorCode: record.operator_code,
    activationCost: record.activation_cost,
    currencyLabel: getHeroSmsCurrencyLabel(record.currency_code),
    canGetAnotherSms: record.can_get_another_sms,
    activationTime: record.activation_time,
    activationEndTime: record.activation_end_time,
    activationStatus: record.activation_status ?? "",
    activationStatusText: getHeroSmsStatusText(record.activation_status, record.sms_text),
    smsCode: record.sms_code,
    smsText: record.sms_text,
    isActive: record.is_active,
    createdAt: record.created_at,
  };
}

export function mapHeroSmsFavoriteRecordToView(
  record: HeroSmsFavoriteRecord,
): HeroSmsFavoriteView {
  return {
    id: record.id,
    serviceCode: record.service_code,
    serviceName: record.service_name,
    countryId: record.country_id,
    countryName: record.country_name,
    operatorCode: record.operator_code,
  };
}
