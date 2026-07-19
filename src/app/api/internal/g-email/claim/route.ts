import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ClaimedGEmailRecord = {
  email_account_id: string;
  email_name: string;
  claimed_at: string;
};

function createCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function getGEmailClaimToken(): string {
  return process.env.HME_INGEST_TOKEN ?? process.env.EXECUTOR_TOKEN ?? "";
}

function isAuthorized(request: Request): boolean {
  const expectedToken = getGEmailClaimToken();

  if (!expectedToken) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${expectedToken}`;
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

  if (!getGEmailClaimToken()) {
    return NextResponse.json(
      { error: "服务端缺少 HME_INGEST_TOKEN（或 EXECUTOR_TOKEN）配置" },
      { status: 500, headers: corsHeaders },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "鉴权失败" }, { status: 401, headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc("claim_next_unregistered_g_email");

    if (error) {
      throw new Error(error.message);
    }

    const record = (data?.[0] ?? null) as ClaimedGEmailRecord | null;

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          email: null,
          error: "当前没有可领取的未注册 G 邮箱",
        },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      {
        success: true,
        email: record.email_name,
        emailAccountId: record.email_account_id,
        claimedAt: record.claimed_at,
        registered: false,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "领取 G 邮箱失败" },
      { status: 500, headers: corsHeaders },
    );
  }
}
