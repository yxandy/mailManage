import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapSmsBowerActivationRecordToView } from "@/lib/sms-bower/activations";
import { syncSmsBowerActivations } from "@/lib/sms-bower/client";
import {
  listActiveSmsBowerActivations,
  updateSmsBowerActivationByActivationId,
} from "@/lib/sms-bower/repository";
import { createSmsBowerReceivedNotification } from "@/lib/notifications/sms-bower";

export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const currentItems = await listActiveSmsBowerActivations();
    const updates = await syncSmsBowerActivations(currentItems);
    const currentItemMap = new Map(currentItems.map((item) => [item.activation_id, item]));

    for (const item of updates) {
      const currentItem = currentItemMap.get(item.activationId);
      await updateSmsBowerActivationByActivationId(item.activationId, {
        activation_status: item.activationStatus,
        sms_code: item.smsCode,
        is_active: item.isActive,
      });

      if (currentItem && item.smsCode && item.smsCode !== currentItem.sms_code) {
        await createSmsBowerReceivedNotification({
          record: currentItem,
          smsCode: item.smsCode,
          smsText: currentItem.sms_text,
        });
      }
    }

    const refreshedItems = await listActiveSmsBowerActivations();

    return NextResponse.json({
      items: refreshedItems.map(mapSmsBowerActivationRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "刷新失败" },
      { status: 500 },
    );
  }
}
