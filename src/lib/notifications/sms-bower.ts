import type { SmsBowerActivationRecord } from "@/lib/sms-bower/types";

import { createNotificationEvent } from "./repository";
import { buildSmsBowerReceivedDedupeKey } from "./sms-bower-dedupe";

const SMS_BOWER_NOTIFICATION_SOURCE = "sms-bower";

function normalizeNotificationPart(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export async function createSmsBowerReceivedNotification(input: {
  record: SmsBowerActivationRecord;
  smsCode: string | null;
  smsText: string | null;
}): Promise<void> {
  const smsCode = normalizeNotificationPart(input.smsCode);
  const smsText = normalizeNotificationPart(input.smsText);

  if (!smsCode && !smsText) {
    return;
  }

  await createNotificationEvent({
    source: SMS_BOWER_NOTIFICATION_SOURCE,
    eventType: "sms_received",
    dedupeKey: buildSmsBowerReceivedDedupeKey({
      activationId: input.record.activation_id,
      smsCode,
      smsText,
    }),
    title: "SMS Bower 收到验证码",
    content: [
      `服务：${input.record.service_name}（${input.record.service_code}）`,
      `国家：${input.record.country_name}（${input.record.country_id}）`,
      `号码：${input.record.phone_number}`,
      `验证码：${smsCode || "未提供"}`,
      `短信正文：${smsText || "未提供"}`,
      `activationId：${input.record.activation_id}`,
    ].join("\n"),
    payload: {
      activationId: input.record.activation_id,
      phoneNumber: input.record.phone_number,
      serviceCode: input.record.service_code,
      serviceName: input.record.service_name,
      countryId: input.record.country_id,
      countryName: input.record.country_name,
      smsCode: smsCode || null,
      smsText: smsText || null,
    },
  });
}
