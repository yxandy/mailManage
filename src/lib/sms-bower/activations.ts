import type {
  SmsBowerActivationRecord,
  SmsBowerActivationView,
  SmsBowerFavoriteRecord,
  SmsBowerFavoriteView,
} from "./types";

const SMS_BOWER_STATUS_LABELS: Record<string, string> = {
  STATUS_WAIT_CODE: "等待接收短信",
  STATUS_WAIT_RETRY: "等待下一条短信",
  STATUS_OK: "收到短信",
  STATUS_CANCEL: "已取消",
  STATUS_FINISHED: "已完成",
};

export function getSmsBowerStatusText(status: string, smsText: string | null): string {
  if (smsText?.trim()) {
    return "收到短信";
  }

  return SMS_BOWER_STATUS_LABELS[status] ?? status;
}

export function canCancelSmsBowerActivation(record: Pick<
  SmsBowerActivationRecord,
  "activation_status" | "sms_code" | "sms_text" | "last_sms_code" | "last_sms_text"
>): boolean {
  return (
    record.activation_status !== "STATUS_OK" &&
    record.activation_status !== "STATUS_WAIT_RETRY" &&
    !record.sms_code?.trim() &&
    !record.sms_text?.trim() &&
    !record.last_sms_code?.trim() &&
    !record.last_sms_text?.trim()
  );
}

export function mapSmsBowerActivationRecordToView(
  record: SmsBowerActivationRecord,
): SmsBowerActivationView {
  return {
    id: record.id,
    activationId: record.activation_id,
    phoneNumber: record.phone_number,
    serviceName: record.service_name,
    serviceCode: record.service_code,
    countryName: record.country_name,
    countryId: record.country_id,
    countryPhoneCode: record.country_phone_code,
    providerId: record.provider_id ?? "",
    providerIds: record.provider_ids,
    activationCost: record.activation_cost,
    activationOperator: record.activation_operator ?? "",
    canGetAnotherSms: record.can_get_another_sms,
    activationTime: record.activation_time,
    activationStatus: record.activation_status,
    activationStatusText: getSmsBowerStatusText(record.activation_status, record.sms_text),
    smsCode: record.sms_code,
    smsText: record.sms_text,
    lastSmsCode: record.last_sms_code,
    lastSmsText: record.last_sms_text,
    isActive: record.is_active,
    createdAt: record.created_at,
  };
}

export function mapSmsBowerFavoriteRecordToView(
  record: SmsBowerFavoriteRecord,
): SmsBowerFavoriteView {
  return {
    id: record.id,
    serviceId: record.service_id,
    serviceCode: record.service_code,
    serviceName: record.service_name,
    minPrice: record.min_price,
    maxPrice: record.max_price,
    earlyRetryMinutes: record.early_retry_minutes,
    earlyRetryIntervalSeconds: record.early_retry_interval_seconds,
    laterRetryIntervalSeconds: record.later_retry_interval_seconds,
    maxWaitMinutes: record.max_wait_minutes,
  };
}
