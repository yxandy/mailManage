import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { getHeroSmsOperators } from "@/lib/hero-sms/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const country = Number(searchParams.get("country"));

  if (!Number.isFinite(country)) {
    return NextResponse.json({ error: "缺少有效的 country 参数" }, { status: 400 });
  }

  try {
    const operators = await getHeroSmsOperators(country);

    return NextResponse.json({ operators });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询运营商失败" },
      { status: 500 },
    );
  }
}
