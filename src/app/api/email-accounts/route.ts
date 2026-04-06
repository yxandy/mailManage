import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { createEmailAccount, listEmailAccounts } from "@/lib/email-accounts/repository";
import { normalizeEmailAccountInput } from "@/lib/email-accounts/schema";

export const runtime = "nodejs";

function parseBooleanFilter(value?: string): boolean | null {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const result = await listEmailAccounts({
      keyword: searchParams.get("keyword") ?? undefined,
      linked: parseBooleanFilter(searchParams.get("linked") ?? undefined),
      expired: parseBooleanFilter(searchParams.get("expired") ?? undefined),
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: 10,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "查询失败",
      },
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
    const body = await request.json();
    const input = normalizeEmailAccountInput(body);

    await createEmailAccount(input);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "新增失败",
      },
      { status: 400 },
    );
  }
}
