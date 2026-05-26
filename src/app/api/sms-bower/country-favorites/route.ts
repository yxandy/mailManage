import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapSmsBowerCountryFavoriteRecordToView } from "@/lib/sms-bower/activations";
import {
  createSmsBowerCountryFavorite,
  listSmsBowerCountryFavorites,
  softDeleteSmsBowerCountryFavorite,
} from "@/lib/sms-bower/repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const items = await listSmsBowerCountryFavorites();

    return NextResponse.json({
      items: items.map(mapSmsBowerCountryFavoriteRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询国家收藏失败" },
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
      countryId?: number;
      countryName?: string;
    };
    const countryId = Number(body.countryId);
    const countryName = body.countryName?.trim() ?? `国家 ${countryId}`;

    if (!Number.isFinite(countryId)) {
      return NextResponse.json({ error: "缺少有效的 countryId 参数" }, { status: 400 });
    }

    await createSmsBowerCountryFavorite({
      countryId,
      countryName,
    });

    const items = await listSmsBowerCountryFavorites();

    return NextResponse.json({
      items: items.map(mapSmsBowerCountryFavoriteRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "收藏国家失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      countryId?: number;
    };
    const countryId = Number(body.countryId);

    if (!Number.isFinite(countryId)) {
      return NextResponse.json({ error: "缺少有效的 countryId 参数" }, { status: 400 });
    }

    await softDeleteSmsBowerCountryFavorite(countryId);

    const items = await listSmsBowerCountryFavorites();

    return NextResponse.json({
      items: items.map(mapSmsBowerCountryFavoriteRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "取消收藏国家失败" },
      { status: 400 },
    );
  }
}
