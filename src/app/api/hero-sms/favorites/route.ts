import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapHeroSmsFavoriteRecordToView } from "@/lib/hero-sms/activations";
import { createHeroSmsFavorite, listHeroSmsFavorites } from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const items = await listHeroSmsFavorites();

    return NextResponse.json({
      items: items.map(mapHeroSmsFavoriteRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询收藏失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      serviceCode?: string;
      serviceName?: string;
      countryId?: number;
      countryName?: string;
      operatorCode?: string;
    };

    const serviceCode = body.serviceCode?.trim() ?? "";
    const serviceName = body.serviceName?.trim() ?? serviceCode;
    const countryId = Number(body.countryId);
    const countryName = body.countryName?.trim() ?? `国家 ${countryId}`;
    const operatorCode = body.operatorCode?.trim() ?? "";

    if (!serviceCode) {
      return NextResponse.json({ error: "缺少 serviceCode 参数" }, { status: 400 });
    }

    if (!Number.isFinite(countryId)) {
      return NextResponse.json({ error: "缺少有效的 countryId 参数" }, { status: 400 });
    }

    await createHeroSmsFavorite({
      serviceCode,
      serviceName,
      countryId,
      countryName,
      operatorCode,
    });

    const items = await listHeroSmsFavorites();

    return NextResponse.json({
      items: items.map(mapHeroSmsFavoriteRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "收藏失败" },
      { status: 400 },
    );
  }
}
