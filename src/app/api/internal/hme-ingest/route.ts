import { NextResponse } from "next/server";

import {
  createEmailAccount,
  findActiveEmailAccountByEmailName,
} from "@/lib/email-accounts/repository";

export const runtime = "nodejs";

type HmeIngestPayload = {
  email?: string;
  label?: string;
  forwardTo?: string;
  source?: string;
  capturedAt?: string;
  pageUrl?: string;
};

function createCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function getIngestToken(): string {
  return process.env.HME_INGEST_TOKEN ?? process.env.EXECUTOR_TOKEN ?? "";
}

function isAuthorized(request: Request): boolean {
  const expectedToken = getIngestToken();
  if (!expectedToken) {
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expectedAuth = `Bearer ${expectedToken}`;
  return authHeader === expectedAuth;
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
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

  if (!getIngestToken()) {
    return NextResponse.json(
      { error: "服务端缺少 HME_INGEST_TOKEN（或 EXECUTOR_TOKEN）配置" },
      { status: 500, headers: corsHeaders },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "鉴权失败" }, { status: 401, headers: corsHeaders });
  }

  try {
    const body = (await request.json()) as HmeIngestPayload;
    const email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json({ error: "email 不能为空" }, { status: 400, headers: corsHeaders });
    }

    const exists = await findActiveEmailAccountByEmailName(email);
    if (exists) {
      return NextResponse.json(
        {
          success: true,
          inserted: false,
          duplicate: true,
          email,
        },
        { headers: corsHeaders },
      );
    }

    await createEmailAccount({
      email_name: email,
      source: body.source?.trim() || "icloud-hme-userscript",
      user_name: body.label?.trim() || null,
      birthday: null,
      registered_at: null,
      registered_location: body.pageUrl?.trim() || null,
      is_registered_cg: false,
      cg_registered_at: null,
      is_linked_s2a: true,
      linked_at: body.capturedAt?.trim() || new Date().toISOString(),
      is_expired: false,
      expired_at: null,
    });

    return NextResponse.json(
      {
        success: true,
        inserted: true,
        duplicate: false,
        email,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "入库失败",
      },
      { status: 500, headers: corsHeaders },
    );
  }
}
