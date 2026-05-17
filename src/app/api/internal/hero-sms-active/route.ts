import { NextResponse } from "next/server";

import { listActiveHeroSmsActivations } from "@/lib/hero-sms/repository";

export const runtime = "nodejs";

function createCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function getInternalToken(): string {
  return process.env.HME_INGEST_TOKEN ?? process.env.EXECUTOR_TOKEN ?? "";
}

function isAuthorized(request: Request): boolean {
  const expectedToken = getInternalToken();

  if (!expectedToken) {
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expectedAuth = `Bearer ${expectedToken}`;

  return authHeader === expectedAuth;
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

  if (!getInternalToken()) {
    return NextResponse.json(
      { error: "服务端缺少 HME_INGEST_TOKEN（或 EXECUTOR_TOKEN）配置" },
      { status: 500, headers: corsHeaders },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "鉴权失败" }, { status: 401, headers: corsHeaders });
  }

  try {
    const items = await listActiveHeroSmsActivations();
    const current = items[0] ?? null;

    return NextResponse.json(
      {
        hasActiveNumber: Boolean(current),
        phoneNumber: current?.phone_number ?? null,
        activationId: current?.activation_id ?? null,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500, headers: corsHeaders },
    );
  }
}
