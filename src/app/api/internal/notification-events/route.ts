import { NextResponse } from "next/server";

import {
  listPendingNotificationEvents,
  mapNotificationEventRecordToView,
} from "@/lib/notifications/repository";
import {
  getNotificationWorkerToken,
  isNotificationWorkerAuthorized,
} from "@/lib/notifications/auth";

export const runtime = "nodejs";

function createCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

export async function GET(request: Request) {
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
    const events = await listPendingNotificationEvents(20);

    return NextResponse.json(
      {
        events: events.map(mapNotificationEventRecordToView),
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询提醒事件失败" },
      { status: 500, headers: corsHeaders },
    );
  }
}
