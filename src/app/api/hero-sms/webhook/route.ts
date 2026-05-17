import { NextResponse } from "next/server";

import type { HeroSmsWebhookPayload } from "@/lib/hero-sms/types";
import {
  findHeroSmsActivationByActivationId,
  updateHeroSmsActivationByActivationId,
} from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

const HERO_SMS_WEBHOOK_ALLOWED_IPS = new Set([
  "84.32.223.53",
  "185.138.88.87",
]);

function buildWebhookLogContext(request: Request) {
  return {
    requestIp: getRequestIp(request),
    xForwardedFor: request.headers.get("x-forwarded-for")?.trim() ?? "",
    xRealIp: request.headers.get("x-real-ip")?.trim() ?? "",
    userAgent: request.headers.get("user-agent")?.trim() ?? "",
    host: request.headers.get("host")?.trim() ?? "",
  };
}

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

function isAuthorized(request: Request): boolean {
  const requestIp = getRequestIp(request);

  return HERO_SMS_WEBHOOK_ALLOWED_IPS.has(requestIp);
}

export async function POST(request: Request) {
  const requestContext = buildWebhookLogContext(request);
  const authorized = isAuthorized(request);

  console.log("[hero-sms webhook] incoming request", {
    ...requestContext,
    authorized,
    allowedIps: Array.from(HERO_SMS_WEBHOOK_ALLOWED_IPS),
  });

  if (!authorized) {
    console.warn("[hero-sms webhook] unauthorized request", requestContext);

    return NextResponse.json({ error: "鉴权失败" }, { status: 401 });
  }

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

    if (!activationId) {
      console.warn("[hero-sms webhook] missing activationId");

      return NextResponse.json({ ok: true });
    }

    const record = await findHeroSmsActivationByActivationId(activationId);

    if (!record) {
      console.warn("[hero-sms webhook] activation record not found", {
        activationId,
      });

      return NextResponse.json({ ok: true });
    }

    const smsText = typeof body.text === "string" ? body.text.trim() : "";
    const smsCode =
      body.code === undefined || body.code === null ? "" : String(body.code).trim();

    console.log("[hero-sms webhook] updating activation", {
      activationId,
      recordId: record.id,
      hasSmsText: smsText.length > 0,
      hasSmsCode: smsCode.length > 0,
    });

    await updateHeroSmsActivationByActivationId(activationId, {
      sms_text: smsText || record.sms_text,
      sms_code: smsCode || record.sms_code,
      activation_status: smsText ? "4" : record.activation_status,
    });

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
