import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapSmsBowerFavoriteRecordToView } from "@/lib/sms-bower/activations";
import {
  createSmsBowerFavorite,
  listSmsBowerFavorites,
  softDeleteSmsBowerFavorite,
} from "@/lib/sms-bower/repository";

export const runtime = "nodejs";

function normalizePriceInput(value: string | number | undefined): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toFixed(4);
}

function normalizePositiveInteger(value: number | undefined): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? Math.floor(numericValue) : Number.NaN;
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const items = await listSmsBowerFavorites();

    return NextResponse.json({
      items: items.map(mapSmsBowerFavoriteRecordToView),
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
      serviceId?: number;
      serviceCode?: string;
      serviceName?: string;
      minPrice?: string;
      maxPrice?: string;
      earlyRetryMinutes?: number;
      earlyRetryIntervalSeconds?: number;
      laterRetryIntervalSeconds?: number;
      maxWaitMinutes?: number;
    };
    const serviceId = Number(body.serviceId);
    const serviceCode = body.serviceCode?.trim() ?? "";
    const serviceName = body.serviceName?.trim() ?? serviceCode;
    const minPrice = normalizePriceInput(body.minPrice);
    const maxPrice = normalizePriceInput(body.maxPrice);
    const earlyRetryMinutes = normalizePositiveInteger(body.earlyRetryMinutes);
    const earlyRetryIntervalSeconds = normalizePositiveInteger(body.earlyRetryIntervalSeconds);
    const laterRetryIntervalSeconds = normalizePositiveInteger(body.laterRetryIntervalSeconds);
    const maxWaitMinutes = normalizePositiveInteger(body.maxWaitMinutes);

    if (!Number.isFinite(serviceId)) {
      return NextResponse.json({ error: "缺少有效的 serviceId 参数" }, { status: 400 });
    }

    if (!serviceCode) {
      return NextResponse.json({ error: "缺少 serviceCode 参数" }, { status: 400 });
    }

    if (!minPrice || !maxPrice || Number(maxPrice) < Number(minPrice)) {
      return NextResponse.json({ error: "缺少有效的价格区间" }, { status: 400 });
    }

    if (
      !Number.isFinite(earlyRetryMinutes) ||
      earlyRetryMinutes < 0 ||
      !Number.isFinite(earlyRetryIntervalSeconds) ||
      earlyRetryIntervalSeconds <= 0 ||
      !Number.isFinite(laterRetryIntervalSeconds) ||
      laterRetryIntervalSeconds <= 0 ||
      !Number.isFinite(maxWaitMinutes) ||
      maxWaitMinutes <= 0
    ) {
      return NextResponse.json({ error: "缺少有效的等待策略参数" }, { status: 400 });
    }

    await createSmsBowerFavorite({
      serviceId,
      serviceCode,
      serviceName,
      minPrice,
      maxPrice,
      earlyRetryMinutes,
      earlyRetryIntervalSeconds,
      laterRetryIntervalSeconds,
      maxWaitMinutes,
    });

    const items = await listSmsBowerFavorites();

    return NextResponse.json({
      items: items.map(mapSmsBowerFavoriteRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "收藏失败" },
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
      id?: string;
    };
    const id = body.id?.trim() ?? "";

    if (!id) {
      return NextResponse.json({ error: "缺少收藏 id 参数" }, { status: 400 });
    }

    await softDeleteSmsBowerFavorite(id);

    const items = await listSmsBowerFavorites();

    return NextResponse.json({
      items: items.map(mapSmsBowerFavoriteRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除收藏失败" },
      { status: 400 },
    );
  }
}
