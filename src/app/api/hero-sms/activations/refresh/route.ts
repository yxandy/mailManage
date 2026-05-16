import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { syncHeroSmsActivations } from "@/lib/hero-sms/client";
import { mapHeroSmsActivationRecordToView } from "@/lib/hero-sms/activations";
import {
  listActiveHeroSmsActivations,
  updateHeroSmsActivationByActivationId,
} from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const currentItems = await listActiveHeroSmsActivations();
    const updates = await syncHeroSmsActivations(currentItems);

    for (const item of updates) {
      await updateHeroSmsActivationByActivationId(item.activationId, {
        activation_status: item.activationStatus,
        sms_code: item.smsCode,
        sms_text: item.smsText,
        is_active: item.isActive,
      });
    }

    const refreshedItems = await listActiveHeroSmsActivations();

    return NextResponse.json({
      items: refreshedItems.map(mapHeroSmsActivationRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "刷新失败" },
      { status: 500 },
    );
  }
}
