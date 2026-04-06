import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { normalizeEmailAccountInput } from "@/lib/email-accounts/schema";
import { softDeleteEmailAccount, updateEmailAccount } from "@/lib/email-accounts/repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = normalizeEmailAccountInput(body);

    await updateEmailAccount(id, input);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "更新失败",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    await softDeleteEmailAccount(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "删除失败",
      },
      { status: 400 },
    );
  }
}
