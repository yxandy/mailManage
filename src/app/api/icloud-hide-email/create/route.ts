import { NextResponse } from "next/server";

import { createIcloudHideEmailRecord } from "@/lib/icloud-automation/api";

export const runtime = "nodejs";

export async function POST() {
  const result = await createIcloudHideEmailRecord();

  return NextResponse.json(result.body, { status: result.status });
}
