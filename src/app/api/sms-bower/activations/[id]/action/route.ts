import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { canCancelSmsBowerActivation } from "@/lib/sms-bower/activations";
import { setSmsBowerActivationStatus } from "@/lib/sms-bower/client";
import {
  getSmsBowerActivationById,
  updateSmsBowerActivationByActivationId,
} from "@/lib/sms-bower/repository";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: "cancel" | "finish" | "retry-sms";
    };
    const action = body.action;

    if (action !== "cancel" && action !== "finish" && action !== "retry-sms") {
      return NextResponse.json({ error: "缺少有效的 action 参数" }, { status: 400 });
    }

    const record = await getSmsBowerActivationById(id);

    if (!record) {
      return NextResponse.json({ error: "未找到对应的 SMS Bower 活动记录" }, { status: 404 });
    }

    if (action === "cancel") {
      if (!canCancelSmsBowerActivation(record)) {
        return NextResponse.json(
          { error: "已收到短信的号码不能取消，请使用完成操作。" },
          { status: 400 },
        );
      }

      await setSmsBowerActivationStatus({
        activationId: record.activation_id,
        status: "8",
      });
      await updateSmsBowerActivationByActivationId(record.activation_id, {
        activation_status: "STATUS_CANCEL",
        is_active: false,
      });
    } else if (action === "finish") {
      await setSmsBowerActivationStatus({
        activationId: record.activation_id,
        status: "6",
      });
      await updateSmsBowerActivationByActivationId(record.activation_id, {
        activation_status: "STATUS_FINISHED",
        is_active: false,
      });
    } else {
      await setSmsBowerActivationStatus({
        activationId: record.activation_id,
        status: "3",
      });
      await updateSmsBowerActivationByActivationId(record.activation_id, {
        activation_status: "STATUS_WAIT_RETRY",
        last_sms_code: record.sms_code,
        last_sms_text: record.sms_text,
        sms_code: null,
        sms_text: null,
        is_active: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 400 },
    );
  }
}
