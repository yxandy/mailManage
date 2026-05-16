import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { purchaseHeroSmsNumber } from "@/lib/hero-sms/client";
import { createHeroSmsActivation } from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      service?: string;
      serviceName?: string;
      country?: number;
      countryName?: string;
      maxPrice?: string;
      operator?: string;
    };

    const service = body.service?.trim() ?? "";
    const serviceName = body.serviceName?.trim() ?? service;
    const country = Number(body.country);
    const countryName = body.countryName?.trim() ?? `国家 ${country}`;
    const maxPrice = body.maxPrice?.trim() ?? "";
    const operator = body.operator?.trim() ?? "";

    if (!service) {
      return NextResponse.json({ error: "缺少 service 参数" }, { status: 400 });
    }

    if (!Number.isFinite(country)) {
      return NextResponse.json({ error: "缺少有效的 country 参数" }, { status: 400 });
    }

    if (!maxPrice) {
      return NextResponse.json({ error: "缺少 maxPrice 参数" }, { status: 400 });
    }

    const result = await purchaseHeroSmsNumber({
      service,
      country,
      maxPrice,
      operator,
    });

    await createHeroSmsActivation({
      purchase: result,
      serviceCode: service,
      serviceName,
      countryId: country,
      countryName,
      operatorCode: operator,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "购买失败" },
      { status: 400 },
    );
  }
}
