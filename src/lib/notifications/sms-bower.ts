import type {
  SmsBowerActivationRecord,
  SmsBowerPriceResult,
  SmsBowerPurchaseResult,
} from "@/lib/sms-bower/types";

import { createNotificationEvent } from "./repository";
import { buildSmsBowerReceivedDedupeKey } from "./sms-bower-dedupe";

const SMS_BOWER_NOTIFICATION_SOURCE = "sms-bower";

function normalizeNotificationPart(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export async function createSmsBowerWaitedPurchaseNotification(input: {
  purchase: SmsBowerPurchaseResult;
  priceItem: Pick<
    SmsBowerPriceResult,
    "serviceCode" | "countryCode" | "countryName" | "providerId" | "providerIds" | "price"
  >;
  serviceName: string;
}): Promise<void> {
  await createNotificationEvent({
    source: SMS_BOWER_NOTIFICATION_SOURCE,
    eventType: "waited_purchase_succeeded",
    dedupeKey: `sms-bower:waited-purchase-succeeded:${input.purchase.activationId}`,
    title: "SMS Bower 等待购买成功",
    content: [
      `服务：${input.serviceName}（${input.priceItem.serviceCode}）`,
      `国家：${input.priceItem.countryName}（${input.priceItem.countryCode}）`,
      `号码：${input.purchase.phoneNumber}`,
      `Provider：${input.priceItem.providerId || input.purchase.activationOperator || "未提供"}`,
      `价格：${input.purchase.activationCost}`,
      `目标价位：${input.priceItem.price}`,
      `activationId：${input.purchase.activationId}`,
    ].join("\n"),
    payload: {
      activationId: input.purchase.activationId,
      phoneNumber: input.purchase.phoneNumber,
      serviceCode: input.priceItem.serviceCode,
      serviceName: input.serviceName,
      countryId: input.priceItem.countryCode,
      countryName: input.priceItem.countryName,
      providerId: input.priceItem.providerId || null,
      providerIds: input.priceItem.providerIds,
      activationCost: input.purchase.activationCost,
      targetPrice: input.priceItem.price,
    },
  });
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
