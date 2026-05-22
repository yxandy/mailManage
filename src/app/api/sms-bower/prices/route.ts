import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { getSmsBowerOptions, searchSmsBowerPrices } from "@/lib/sms-bower/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const serviceCode = searchParams.get("service")?.trim() ?? "";
    const minPrice = Number(searchParams.get("minPrice") ?? "");
    const maxPrice = Number(searchParams.get("maxPrice") ?? "");

    if (!serviceCode) {
      return NextResponse.json({ error: "缺少 service 参数" }, { status: 400 });
    }

    if (!Number.isFinite(minPrice) || minPrice < 0) {
      return NextResponse.json({ error: "缺少有效的最低价" }, { status: 400 });
    }

    if (!Number.isFinite(maxPrice) || maxPrice <= 0 || maxPrice < minPrice) {
      return NextResponse.json({ error: "缺少有效的最高价" }, { status: 400 });
    }

    const { countries } = await getSmsBowerOptions();
    const items = await searchSmsBowerPrices({
      serviceCode,
      minPrice,
      maxPrice,
      countries,
    });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询 SMS Bower 价格失败" },
      { status: 500 },
    );
  }
}
