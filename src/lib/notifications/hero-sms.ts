import type { HeroSmsActivationRecord, HeroSmsPurchaseResultView } from "@/lib/hero-sms/types";
import type { HeroSmsPriceMonitorRecord } from "@/lib/hero-sms/types";

import { buildHeroSmsReceivedDedupeKey } from "./hero-sms-dedupe";
import { createNotificationEvent } from "./repository";

const HERO_SMS_NOTIFICATION_SOURCE = "hero-sms";

function normalizeNotificationPart(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizeNotificationPrice(value: string | number): string {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue.toFixed(4) : String(value).trim();
}

export async function createHeroSmsAutoRetryPurchaseNotification(input: {
  purchase: HeroSmsPurchaseResultView;
  serviceCode: string;
  serviceName: string;
  countryId: number;
  countryName: string;
  operatorCode: string;
  retryAttempt: number;
}): Promise<void> {
  await createNotificationEvent({
    source: HERO_SMS_NOTIFICATION_SOURCE,
    eventType: "auto_retry_purchase_succeeded",
    dedupeKey: `hero-sms:auto-retry-purchase-succeeded:${input.purchase.activationId}`,
    title: "HeroSMS 自动重试购买成功",
    content: [
      `服务：${input.serviceName}（${input.serviceCode}）`,
      `国家：${input.countryName}（${input.countryId}）`,
      `号码：${input.purchase.phoneNumber}`,
      `运营商：${input.operatorCode || input.purchase.activationOperator}`,
      `价格：${input.purchase.activationCost}`,
      `重试次数：第 ${input.retryAttempt} 次`,
      `activationId：${input.purchase.activationId}`,
    ].join("\n"),
    payload: {
      activationId: input.purchase.activationId,
      phoneNumber: input.purchase.phoneNumber,
      serviceCode: input.serviceCode,
      serviceName: input.serviceName,
      countryId: input.countryId,
      countryName: input.countryName,
      operatorCode: input.operatorCode || input.purchase.activationOperator,
      activationCost: input.purchase.activationCost,
      retryAttempt: input.retryAttempt,
    },
  });
}

export async function createHeroSmsReceivedNotification(input: {
  record: HeroSmsActivationRecord;
  smsCode: string | null;
  smsText: string | null;
}): Promise<void> {
  const smsCode = normalizeNotificationPart(input.smsCode);
  const smsText = normalizeNotificationPart(input.smsText);

  if (!smsCode && !smsText) {
    return;
  }

  await createNotificationEvent({
    source: HERO_SMS_NOTIFICATION_SOURCE,
    eventType: "sms_received",
    dedupeKey: buildHeroSmsReceivedDedupeKey({
      activationId: input.record.activation_id,
      smsCode,
      smsText,
    }),
    title: "HeroSMS 收到验证码",
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

export async function createHeroSmsPriceMonitorNotification(input: {
  monitor: HeroSmsPriceMonitorRecord;
  availableCount: number;
  checkedAt: string;
}): Promise<void> {
  const targetPrice = normalizeNotificationPrice(input.monitor.target_price);

  await createNotificationEvent({
    source: HERO_SMS_NOTIFICATION_SOURCE,
    eventType: "price_stock_available",
    dedupeKey: `hero-sms:price-monitor:${input.monitor.id}:${input.monitor.updated_at}`,
    title: "HeroSMS 价格有货",
    content: [
      `服务：${input.monitor.service_name}（${input.monitor.service_code}）`,
      `国家：${input.monitor.country_name}（${input.monitor.country_id}）`,
      `运营商：${input.monitor.operator_name}（${input.monitor.operator_code}）`,
      `目标价格：${targetPrice}`,
      `当前库存：${input.availableCount}`,
      `检查时间：${input.checkedAt}`,
    ].join("\n"),
    payload: {
      monitorId: input.monitor.id,
      serviceCode: input.monitor.service_code,
      serviceName: input.monitor.service_name,
      countryId: input.monitor.country_id,
      countryName: input.monitor.country_name,
      operatorCode: input.monitor.operator_code,
      operatorName: input.monitor.operator_name,
      targetPrice,
      availableCount: input.availableCount,
      checkedAt: input.checkedAt,
    },
  });
}
