import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapHeroSmsActivationRecordToView } from "@/lib/hero-sms/activations";
import { listActiveHeroSmsActivations } from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const items = await listActiveHeroSmsActivations();

    return NextResponse.json({
      items: items.map(mapHeroSmsActivationRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 },
    );
  }
}
