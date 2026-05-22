import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapSmsBowerActivationRecordToView } from "@/lib/sms-bower/activations";
import { listActiveSmsBowerActivations } from "@/lib/sms-bower/repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const items = await listActiveSmsBowerActivations();

    return NextResponse.json({
      items: items.map(mapSmsBowerActivationRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 },
    );
  }
}
