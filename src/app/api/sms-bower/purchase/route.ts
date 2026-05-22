import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/auth";
import { createSmsBowerWaitedPurchaseNotification } from "@/lib/notifications/sms-bower";
import { SmsBowerNoNumbersError, purchaseSmsBowerNumber } from "@/lib/sms-bower/client";
import { createSmsBowerActivation } from "@/lib/sms-bower/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "未登录或登录已失效" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      serviceCode?: string;
      serviceName?: string;
      countryCode?: number;
      countryName?: string;
      price?: string;
      providerId?: string;
      providerIds?: string;
      notifyOnSuccess?: boolean;
    };
    const serviceCode = body.serviceCode?.trim() ?? "";
    const serviceName = body.serviceName?.trim() ?? serviceCode;
    const countryCode = Number(body.countryCode);
    const countryName = body.countryName?.trim() ?? `国家 ${countryCode}`;
    const price = body.price?.trim() ?? "";
    const providerId = body.providerId?.trim() ?? "";
    const providerIds = body.providerIds?.trim() ?? "";
    const notifyOnSuccess = body.notifyOnSuccess === true;

    if (!serviceCode) {
      return NextResponse.json({ error: "缺少 serviceCode 参数" }, { status: 400 });
    }

    if (!Number.isFinite(countryCode)) {
      return NextResponse.json({ error: "缺少有效的 countryCode 参数" }, { status: 400 });
    }

    if (!price || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "缺少有效的价格" }, { status: 400 });
    }

    if (!providerIds) {
      return NextResponse.json({ error: "缺少 providerIds 参数" }, { status: 400 });
    }

    const result = await purchaseSmsBowerNumber({
      serviceCode,
      countryId: countryCode,
      price,
      providerIds,
    });

    await createSmsBowerActivation({
      purchase: result,
      priceItem: {
        serviceCode,
        countryCode,
        countryName,
        providerId,
        providerIds,
      },
      serviceName,
      rawPayload: {
        requestedPrice: price,
        requestedProviderIds: providerIds,
      },
    });

    if (notifyOnSuccess) {
      await createSmsBowerWaitedPurchaseNotification({
        purchase: result,
        priceItem: {
          serviceCode,
          countryCode,
          countryName,
          providerId,
          providerIds,
          price,
        },
        serviceName,
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof SmsBowerNoNumbersError) {
      return NextResponse.json(
        { pending: true, error: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SMS Bower 购买失败" },
      { status: 400 },
    );
  }
}
