import { NextResponse } from "next/server";

import {
  getNotificationWorkerToken,
  isNotificationWorkerAuthorized,
} from "@/lib/notifications/auth";
import { markNotificationEventSent } from "@/lib/notifications/repository";

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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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
    const { id } = await context.params;

    if (!id.trim()) {
      return NextResponse.json({ error: "缺少事件 ID" }, { status: 400, headers: corsHeaders });
    }

    await markNotificationEventSent(id);

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "标记提醒事件已发送失败" },
      { status: 500, headers: corsHeaders },
    );
  }
}
