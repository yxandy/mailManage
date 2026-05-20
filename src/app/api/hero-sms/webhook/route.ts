import { NextResponse } from "next/server";

import type { HeroSmsWebhookPayload } from "@/lib/hero-sms/types";
import { buildHeroSmsActivationHistoryFromRecord } from "@/lib/hero-sms/history";
import {
  findHeroSmsActivationByActivationId,
  listActiveHeroSmsActivations,
  updateHeroSmsActivationByActivationId,
  upsertHeroSmsActivationHistory,
} from "@/lib/hero-sms/repository";
import { createHeroSmsReceivedNotification } from "@/lib/notifications/hero-sms";

export const runtime = "nodejs";

function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.trim() ?? "";

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();

    if (firstIp) {
      return firstIp;
    }
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function buildWebhookLogContext(request: Request) {
  return {
    requestIp: getRequestIp(request),
    xForwardedFor: request.headers.get("x-forwarded-for")?.trim() ?? "",
    xRealIp: request.headers.get("x-real-ip")?.trim() ?? "",
    userAgent: request.headers.get("user-agent")?.trim() ?? "",
    host: request.headers.get("host")?.trim() ?? "",
  };
}

export async function POST(request: Request) {
  const requestContext = buildWebhookLogContext(request);
  console.log("[hero-sms webhook] incoming request", {
    ...requestContext,
  });

  try {
    const body = (await request.json()) as HeroSmsWebhookPayload;
    const activationId =
      body.activationId === undefined || body.activationId === null
        ? ""
        : String(body.activationId).trim();

    console.log("[hero-sms webhook] parsed payload", {
      activationId,
      service:
        body.service === undefined || body.service === null
          ? ""
          : String(body.service).trim(),
      country:
        body.country === undefined || body.country === null
          ? ""
          : String(body.country).trim(),
      hasText: typeof body.text === "string" && body.text.trim().length > 0,
      hasCode:
        !(body.code === undefined || body.code === null) &&
        String(body.code).trim().length > 0,
      receivedAt:
        body.receivedAt === undefined || body.receivedAt === null
          ? ""
          : String(body.receivedAt).trim(),
    });

    const activeRecords = await listActiveHeroSmsActivations();

    console.log("[hero-sms webhook] active window check", {
      activeCount: activeRecords.length,
      activeActivationIds: activeRecords.map((item) => item.activation_id),
    });

    if (activeRecords.length === 0) {
      console.warn("[hero-sms webhook] no active activations, reject webhook");

      return NextResponse.json({ error: "当前没有活动中的号码，拒绝接收 webhook" }, { status: 403 });
    }

    if (!activationId) {
      console.warn("[hero-sms webhook] missing activationId");

      return NextResponse.json({ error: "缺少 activationId" }, { status: 400 });
    }

    const record = await findHeroSmsActivationByActivationId(activationId);

    if (!record || !record.is_active) {
      console.warn("[hero-sms webhook] activation record not active or not found", {
        activationId,
        found: Boolean(record),
        isActive: record?.is_active ?? false,
      });

      return NextResponse.json({ error: "activationId 未匹配到当前活动中的号码" }, { status: 403 });
    }

    const smsText = typeof body.text === "string" ? body.text.trim() : "";
    const smsCode =
      body.code === undefined || body.code === null ? "" : String(body.code).trim();
    const receivedAt =
      body.receivedAt === undefined || body.receivedAt === null
        ? null
        : String(body.receivedAt).trim();

    console.log("[hero-sms webhook] updating activation", {
      activationId,
      recordId: record.id,
      hasSmsText: smsText.length > 0,
      hasSmsCode: smsCode.length > 0,
    });

    await updateHeroSmsActivationByActivationId(activationId, {
      sms_text: smsText || record.sms_text,
      sms_code: smsCode || record.sms_code,
      activation_status: smsText ? "2" : record.activation_status,
    });

    await createHeroSmsReceivedNotification({
      record,
      smsCode: smsCode || record.sms_code,
      smsText: smsText || record.sms_text,
    });

    if (smsCode || smsText) {
      await upsertHeroSmsActivationHistory([
        buildHeroSmsActivationHistoryFromRecord({
          record,
          smsCode: smsCode || record.sms_code,
          smsText: smsText || record.sms_text,
          receivedAt,
          rawPayload: body,
        }),
      ]);
    }

    console.log("[hero-sms webhook] activation updated", {
      activationId,
      recordId: record.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[hero-sms webhook] processing failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook 处理失败" },
      { status: 500 },
    );
  }
}
