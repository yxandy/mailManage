import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { syncHeroSmsActivations } from "@/lib/hero-sms/client";
import { mapHeroSmsActivationRecordToView } from "@/lib/hero-sms/activations";
import { buildHeroSmsActivationHistoryFromRecord } from "@/lib/hero-sms/history";
import {
  listActiveHeroSmsActivations,
  updateHeroSmsActivationByActivationId,
  upsertHeroSmsActivationHistory,
} from "@/lib/hero-sms/repository";
import { createHeroSmsReceivedNotification } from "@/lib/notifications/hero-sms";

export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const currentItems = await listActiveHeroSmsActivations();
    const updates = await syncHeroSmsActivations(currentItems);
    const currentItemMap = new Map(currentItems.map((item) => [item.activation_id, item]));

    for (const item of updates) {
      const currentItem = currentItemMap.get(item.activationId);
      await updateHeroSmsActivationByActivationId(item.activationId, {
        activation_status: item.activationStatus,
        sms_code: item.smsCode,
        sms_text: item.smsText,
        is_active: item.isActive,
      });

      if (
        currentItem &&
        (item.smsCode || item.smsText) &&
        (item.smsCode !== currentItem.sms_code || item.smsText !== currentItem.sms_text)
      ) {
        await createHeroSmsReceivedNotification({
          record: currentItem,
          smsCode: item.smsCode,
          smsText: item.smsText,
        });
        await upsertHeroSmsActivationHistory([
          buildHeroSmsActivationHistoryFromRecord({
            record: currentItem,
            smsCode: item.smsCode,
            smsText: item.smsText,
          }),
        ]);
      }
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
