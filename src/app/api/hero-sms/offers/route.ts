import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { getHeroSmsOffer } from "@/lib/hero-sms/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service")?.trim() ?? "";
    const country = Number(searchParams.get("country") ?? "");

    if (!service) {
      return NextResponse.json({ error: "缺少 service 参数" }, { status: 400 });
    }

    if (!Number.isFinite(country)) {
      return NextResponse.json({ error: "缺少有效的 country 参数" }, { status: 400 });
    }

    const offer = await getHeroSmsOffer(service, country);

    return NextResponse.json({ offer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 },
    );
  }
}
