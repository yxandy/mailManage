import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { purchaseSmsBowerNumber } from "@/lib/sms-bower/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      serviceCode?: string;
      countryId?: number;
      price?: string;
      providerId?: string;
    };
    const serviceCode = body.serviceCode?.trim() ?? "";
    const countryId = Number(body.countryId);
    const price = body.price?.trim() ?? "";
    const providerId = body.providerId?.trim() ?? "";

    if (!serviceCode) {
      return NextResponse.json({ error: "缺少 serviceCode 参数" }, { status: 400 });
    }

    if (!Number.isFinite(countryId)) {
      return NextResponse.json({ error: "缺少有效的 countryId 参数" }, { status: 400 });
    }

    if (!price || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "缺少有效的价格" }, { status: 400 });
    }

    if (!providerId) {
      return NextResponse.json({ error: "缺少 providerId 参数" }, { status: 400 });
    }

    const result = await purchaseSmsBowerNumber({
      serviceCode,
      countryId,
      price,
      providerId,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SMS Bower 购买失败" },
      { status: 400 },
    );
  }
}
