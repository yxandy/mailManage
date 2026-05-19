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
  "1": "等待接收短信",
  "2": "收到短信",
  "3": "等待再次接收短信",
  "4": "等待接收短信",
  "6": "已完成",
  "8": "已取消",
};

export const HERO_SMS_CANCEL_LOCK_MS = 2 * 60 * 1000;

export function getHeroSmsCurrencyLabel(code: number): string {
  return HERO_SMS_CURRENCY_LABELS[code] ?? `货币代码 ${code}`;
}

export function getHeroSmsStatusText(status: string | null, smsText: string | null): string {
  if (smsText?.trim()) {
    return "收到短信";
  }

  if (!status) {
    return "等待接收短信";
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

export function getHeroSmsActivationSmsDisplay(input: {
  smsCode: string | null;
  smsText: string | null;
  showDigitsOnly: boolean;
}): string {
  const smsCode = input.smsCode?.trim() ?? "";

  if (smsCode) {
    return smsCode;
  }

  const smsText = input.smsText?.trim() ?? "";

  if (!smsText) {
    return "";
  }

  return input.showDigitsOnly ? extractDigitsFromSmsText(smsText) || smsText : smsText;
}

export function hasHeroSmsActivationReceivedSms(item: {
  smsCode: string | null;
  smsText: string | null;
  lastSmsCode: string | null;
  lastSmsText: string | null;
  activationStatus: string;
}): boolean {
  return Boolean(
    item.smsText ||
      item.smsCode ||
      item.lastSmsText ||
      item.lastSmsCode ||
      item.activationStatus === "2" ||
      item.activationStatus === "3",
  );
}

export function getHeroSmsCancelLockRemainingMs(
  item: {
    createdAt: string;
  },
  now: number,
): number | null {
  const localCreatedAt = new Date(item.createdAt).getTime();

  if (Number.isNaN(localCreatedAt)) {
    return null;
  }

  return Math.max(localCreatedAt + HERO_SMS_CANCEL_LOCK_MS - now, 0);
}

export function canCancelHeroSmsActivation(
  item: {
    smsCode: string | null;
    smsText: string | null;
    lastSmsCode: string | null;
    lastSmsText: string | null;
    activationStatus: string;
    createdAt: string;
  },
  now: number,
): boolean {
  return (
    !hasHeroSmsActivationReceivedSms(item) &&
    getHeroSmsCancelLockRemainingMs(item, now) === 0
  );
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
    lastSmsCode: record.last_sms_code,
    lastSmsText: record.last_sms_text,
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
    operatorCode: record.operator_code ?? "",
  };
}
