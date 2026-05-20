import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { mapHeroSmsPriceMonitorRecordToView } from "@/lib/hero-sms/activations";
import {
  listHeroSmsPriceMonitors,
  softDeleteHeroSmsPriceMonitor,
  updateHeroSmsPriceMonitorStatus,
} from "@/lib/hero-sms/repository";
import type { HeroSmsPriceMonitorStatus } from "@/lib/hero-sms/types";

export const runtime = "nodejs";

function isValidPatchStatus(
  status: string | undefined,
): status is Exclude<HeroSmsPriceMonitorStatus, "deleted"> {
  return status === "active" || status === "paused" || status === "triggered";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: string;
    };

    if (!id.trim()) {
      return NextResponse.json({ error: "缺少监控 ID" }, { status: 400 });
    }

    if (!isValidPatchStatus(body.status)) {
      return NextResponse.json({ error: "缺少有效的 status 参数" }, { status: 400 });
    }

    await updateHeroSmsPriceMonitorStatus(id, body.status);

    const items = await listHeroSmsPriceMonitors();

    return NextResponse.json({
      items: items.map(mapHeroSmsPriceMonitorRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新价格监控失败" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    if (!id.trim()) {
      return NextResponse.json({ error: "缺少监控 ID" }, { status: 400 });
    }

    await softDeleteHeroSmsPriceMonitor(id);

    const items = await listHeroSmsPriceMonitors();

    return NextResponse.json({
      items: items.map(mapHeroSmsPriceMonitorRecordToView),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除价格监控失败" },
      { status: 400 },
    );
  }
}
