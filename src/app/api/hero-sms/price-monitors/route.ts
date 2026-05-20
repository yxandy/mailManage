import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapHeroSmsPriceMonitorRecordToView } from "@/lib/hero-sms/activations";
import {
  getHeroSmsPriceMonitorOperatorName,
  normalizeHeroSmsMonitorPrice,
} from "@/lib/hero-sms/price-monitor-rules";
import {
  createHeroSmsPriceMonitor,
  listHeroSmsPriceMonitors,
} from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const items = await listHeroSmsPriceMonitors();

    return NextResponse.json({
      items: items.map(mapHeroSmsPriceMonitorRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询价格监控失败" },
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
      operatorName?: string;
      targetPrice?: string;
    };
    const serviceCode = body.serviceCode?.trim() ?? "";
    const serviceName = body.serviceName?.trim() ?? serviceCode;
    const countryId = Number(body.countryId);
    const countryName = body.countryName?.trim() ?? `国家 ${countryId}`;
    const operatorCode = body.operatorCode?.trim() || "any";
    const operatorName = getHeroSmsPriceMonitorOperatorName({
      operatorCode,
      operatorName: body.operatorName,
    });
    const targetPrice = normalizeHeroSmsMonitorPrice(body.targetPrice ?? "");

    if (!serviceCode) {
      return NextResponse.json({ error: "缺少 serviceCode 参数" }, { status: 400 });
    }

    if (!Number.isFinite(countryId)) {
      return NextResponse.json({ error: "缺少有效的 countryId 参数" }, { status: 400 });
    }

    await createHeroSmsPriceMonitor({
      serviceCode,
      serviceName,
      countryId,
      countryName,
      operatorCode,
      operatorName,
      targetPrice,
    });

    const items = await listHeroSmsPriceMonitors();

    return NextResponse.json({
      items: items.map(mapHeroSmsPriceMonitorRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建价格监控失败" },
      { status: 400 },
    );
  }
}
