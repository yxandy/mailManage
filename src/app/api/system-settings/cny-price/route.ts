import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { getCnyPrice, updateCnyPrice } from "@/lib/system-settings/repository";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const cnyPrice = await getCnyPrice();

    return NextResponse.json({ cnyPrice });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { cnyPrice?: number };
    const cnyPrice = await updateCnyPrice(body.cnyPrice ?? Number.NaN);

    return NextResponse.json({ cnyPrice });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新失败" },
      { status: 400 },
    );
  }
}
