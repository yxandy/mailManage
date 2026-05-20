import { NextResponse } from "next/server";

import { checkActiveHeroSmsPriceMonitors } from "@/lib/hero-sms/price-monitors";
import {
  getNotificationWorkerToken,
  isNotificationWorkerAuthorized,
} from "@/lib/notifications/auth";

export const runtime = "nodejs";

function createCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const corsHeaders = createCorsHeaders(origin);

  if (!getNotificationWorkerToken()) {
    return NextResponse.json(
      { error: "服务端缺少 NOTIFICATION_WORKER_TOKEN 配置" },
      { status: 500, headers: corsHeaders },
    );
  }

  if (!isNotificationWorkerAuthorized(request)) {
    return NextResponse.json({ error: "鉴权失败" }, { status: 401, headers: corsHeaders });
  }

  try {
    const result = await checkActiveHeroSmsPriceMonitors();

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "检查 HeroSMS 价格监控失败" },
      { status: 500, headers: corsHeaders },
    );
  }
}
