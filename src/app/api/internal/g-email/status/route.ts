import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type GEmailStatusPayload = {
  email?: string;
  isRegisteredG?: boolean;
  gRegisteredAt?: string | null;
  isLinkedS2A?: boolean;
  linkedAt?: string | null;
  is_registered_g?: boolean;
  g_registered_at?: string | null;
  is_linked_s2a?: boolean;
  linked_at?: string | null;
};

function createCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function getGEmailToken(): string {
  return process.env.HME_INGEST_TOKEN ?? process.env.EXECUTOR_TOKEN ?? "";
}

function isAuthorized(request: Request): boolean {
  const expectedToken = getGEmailToken();

  if (!expectedToken) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${expectedToken}`;
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeOptionalDateTime(value: string | null | undefined): string | null {
  if (value === null) {
    return null;
  }

  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("时间格式不正确");
  }

  return parsedDate.toISOString();
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

  if (!getGEmailToken()) {
    return NextResponse.json(
      { error: "服务端缺少 HME_INGEST_TOKEN（或 EXECUTOR_TOKEN）配置" },
      { status: 500, headers: corsHeaders },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "鉴权失败" }, { status: 401, headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as GEmailStatusPayload;
    const email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json({ error: "email 不能为空" }, { status: 400, headers: corsHeaders });
    }

    const isRegisteredG = body.isRegisteredG ?? body.is_registered_g;
    const isLinkedS2A = body.isLinkedS2A ?? body.is_linked_s2a;
    const gRegisteredAt = body.gRegisteredAt ?? body.g_registered_at;
    const linkedAt = body.linkedAt ?? body.linked_at;

    if (typeof isRegisteredG !== "boolean" && typeof isLinkedS2A !== "boolean") {
      return NextResponse.json(
        { error: "至少需要提供 isRegisteredG 或 isLinkedS2A" },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: account, error: accountError } = await supabase
      .from("email_accounts")
      .select("id,email_name")
      .eq("email_name", email)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (accountError) {
      throw new Error(accountError.message);
    }

    if (!account) {
      return NextResponse.json(
        { error: "未找到对应邮箱" },
        { status: 404, headers: corsHeaders },
      );
    }

    const payload: Record<string, boolean | string | null> = {};

    if (typeof isRegisteredG === "boolean") {
      payload.is_registered = isRegisteredG;
      payload.registered_at = isRegisteredG
        ? normalizeOptionalDateTime(gRegisteredAt) ?? new Date().toISOString()
        : null;
    }

    if (typeof isLinkedS2A === "boolean") {
      payload.is_linked_s2a = isLinkedS2A;
      payload.linked_at = isLinkedS2A
        ? normalizeOptionalDateTime(linkedAt) ?? new Date().toISOString()
        : null;
    }

    const { data: state, error: stateError } = await supabase
      .from("email_account_type_states")
      .update(payload)
      .eq("email_account_id", account.id)
      .eq("type_code", "g")
      .is("deleted_at", null)
      .select("is_registered,registered_at,is_linked_s2a,linked_at")
      .limit(1)
      .maybeSingle();

    if (stateError) {
      throw new Error(stateError.message);
    }

    if (!state) {
      return NextResponse.json(
        { error: "未找到对应邮箱的 G 类型状态" },
        { status: 404, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      {
        success: true,
        email: account.email_name,
        emailAccountId: account.id,
        g: {
          isRegistered: state.is_registered,
          registeredAt: state.registered_at,
          isLinkedS2A: state.is_linked_s2a,
          linkedAt: state.linked_at,
        },
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新 G 邮箱状态失败" },
      { status: 500, headers: corsHeaders },
    );
  }
}
