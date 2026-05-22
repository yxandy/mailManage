import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { getSmsBowerOptions } from "@/lib/sms-bower/client";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const result = await getSmsBowerOptions();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询 SMS Bower 选项失败" },
      { status: 500 },
    );
  }
}
