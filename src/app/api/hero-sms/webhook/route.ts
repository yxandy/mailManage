import { NextResponse } from "next/server";

import { getRequiredEnv } from "@/lib/env";
import type { HeroSmsWebhookPayload } from "@/lib/hero-sms/types";
import {
  findHeroSmsActivationByActivationId,
  updateHeroSmsActivationByActivationId,
} from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const expectedSecret = getRequiredEnv("HERO_SMS_WEBHOOK_SECRET");
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret")?.trim() ?? "";

  return secret === expectedSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "鉴权失败" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HeroSmsWebhookPayload;
    const activationId =
      body.activationId === undefined || body.activationId === null
        ? ""
        : String(body.activationId).trim();

    if (!activationId) {
      return NextResponse.json({ ok: true });
    }

    const record = await findHeroSmsActivationByActivationId(activationId);

    if (!record) {
      return NextResponse.json({ ok: true });
    }

    const smsText = typeof body.text === "string" ? body.text.trim() : "";
    const smsCode =
      body.code === undefined || body.code === null ? "" : String(body.code).trim();

    await updateHeroSmsActivationByActivationId(activationId, {
      sms_text: smsText || record.sms_text,
      sms_code: smsCode || record.sms_code,
      activation_status: smsText ? "4" : record.activation_status,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook 处理失败" },
      { status: 500 },
    );
  }
}
