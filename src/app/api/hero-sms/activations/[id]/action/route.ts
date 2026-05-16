import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import {
  cancelHeroSmsActivation,
  finishHeroSmsActivation,
} from "@/lib/hero-sms/client";
import {
  getHeroSmsActivationById,
  updateHeroSmsActivationByActivationId,
} from "@/lib/hero-sms/repository";

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
      action?: "cancel" | "finish";
    };
    const action = body.action;

    if (action !== "cancel" && action !== "finish") {
      return NextResponse.json({ error: "缺少有效的 action 参数" }, { status: 400 });
    }

    const record = await getHeroSmsActivationById(id);

    if (!record) {
      return NextResponse.json({ error: "未找到对应的 HeroSMS 活动记录" }, { status: 404 });
    }

    if (action === "cancel") {
      await cancelHeroSmsActivation(record.activation_id);
    } else {
      await finishHeroSmsActivation(record.activation_id);
    }

    await updateHeroSmsActivationByActivationId(record.activation_id, {
      activation_status: action === "cancel" ? "8" : "6",
      is_active: false,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 400 },
    );
  }
}
