import { NextResponse } from "next/server";

import type { SmsBowerWebhookPayload } from "@/lib/sms-bower/types";
import {
  findSmsBowerActivationByActivationId,
  listActiveSmsBowerActivations,
  updateSmsBowerActivationByActivationId,
} from "@/lib/sms-bower/repository";
import { createSmsBowerReceivedNotification } from "@/lib/notifications/sms-bower";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SmsBowerWebhookPayload;
    const activationId =
      body.activationId === undefined || body.activationId === null
        ? ""
        : String(body.activationId).trim();

    const activeRecords = await listActiveSmsBowerActivations();

    if (activeRecords.length === 0) {
      return NextResponse.json({ error: "当前没有活动中的号码，拒绝接收 webhook" }, { status: 403 });
    }

    if (!activationId) {
      return NextResponse.json({ error: "缺少 activationId" }, { status: 400 });
    }

    const record = await findSmsBowerActivationByActivationId(activationId);

    if (!record || !record.is_active) {
      return NextResponse.json({ error: "activationId 未匹配到当前活动中的号码" }, { status: 403 });
    }

    const smsText = typeof body.text === "string" ? body.text.trim() : "";
    const smsCode =
      body.code === undefined || body.code === null ? "" : String(body.code).trim();

    await updateSmsBowerActivationByActivationId(activationId, {
      sms_text: smsText || record.sms_text,
      sms_code: smsCode || record.sms_code,
      activation_status: smsCode || smsText ? "STATUS_OK" : record.activation_status,
    });

    await createSmsBowerReceivedNotification({
      record,
      smsCode: smsCode || record.sms_code,
      smsText: smsText || record.sms_text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook 处理失败" },
      { status: 500 },
    );
  }
}
