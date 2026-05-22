import { getRequiredEnv } from "../env";

import {
  mapSmsBowerFrontendPrices,
  mapSmsBowerFrontendServices,
  mapSmsBowerPurchaseV2,
  mapSmsBowerStatusText,
} from "./transformers";
import type {
  SmsBowerActivationRecord,
  SmsBowerActivationStatus,
  SmsBowerCountryOption,
  SmsBowerPriceResult,
  SmsBowerPurchaseResult,
  SmsBowerServiceOption,
} from "./types";

const SMS_BOWER_COMPAT_BASE_URL = "https://smsbower.page/stubs/handler_api.php";
const SMS_BOWER_WEB_BASE_URL = "https://smsbower.app";

export class SmsBowerNoNumbersError extends Error {
  constructor() {
    super("SMS Bower 当前没有符合条件的号码");
    this.name = "SmsBowerNoNumbersError";
  }
}

function getSmsBowerApiKey(): string {
  return getRequiredEnv("SMS_BOWER_API_KEY");
}

async function fetchSmsBowerText(params: URLSearchParams): Promise<string> {
  params.set("api_key", getSmsBowerApiKey());

  const response = await fetch(`${SMS_BOWER_COMPAT_BASE_URL}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`SMS Bower 请求失败：${response.status}`);
  }

  if (text.startsWith("BAD_KEY")) {
    throw new Error("SMS Bower API Key 无效");
  }

  if (text.startsWith("NO_BALANCE")) {
    throw new Error("SMS Bower 余额不足");
  }

  if (text.startsWith("NO_NUMBERS")) {
    throw new SmsBowerNoNumbersError();
  }

  return text;
}

async function fetchSmsBowerJson<T>(params: URLSearchParams): Promise<T> {
  const text = await fetchSmsBowerText(params);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`SMS Bower 返回了无法解析的 JSON：${text}`);
  }
}

async function fetchSmsBowerWebJson<T>(path: string, params: URLSearchParams): Promise<T> {
  const response = await fetch(`${SMS_BOWER_WEB_BASE_URL}${path}?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SMS Bower 前台价格请求失败：${response.status}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`SMS Bower 前台价格返回了无法解析的 JSON：${text.slice(0, 200)}`);
  }
}

export async function getSmsBowerOptions(): Promise<{
  services: SmsBowerServiceOption[];
  countries: SmsBowerCountryOption[];
}> {
  const frontendServicesResponse = await fetchSmsBowerWebJson<
    Parameters<typeof mapSmsBowerFrontendServices>[0]
  >(
    "/activations/getPricesByService",
    new URLSearchParams({
      serviceId: "4",
      withPopular: "true",
    }),
  );

  return {
    services: mapSmsBowerFrontendServices(frontendServicesResponse),
    countries: [],
  };
}

export async function searchSmsBowerPrices(input: {
  serviceId: number;
  serviceCode: string;
  minPrice: number;
  maxPrice: number;
}): Promise<SmsBowerPriceResult[]> {
  const response = await fetchSmsBowerWebJson<Parameters<typeof mapSmsBowerFrontendPrices>[0]["response"]>(
    "/activations/getPricesByService",
    new URLSearchParams({
      serviceId: String(input.serviceId),
      withPopular: "true",
    }),
  );

  return mapSmsBowerFrontendPrices({
    response,
    serviceId: input.serviceId,
    serviceCode: input.serviceCode,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
  });
}

export async function purchaseSmsBowerNumber(input: {
  serviceCode: string;
  countryId: number;
  price: string;
  providerIds: string;
}): Promise<SmsBowerPurchaseResult> {
  const response = await fetchSmsBowerJson<Parameters<typeof mapSmsBowerPurchaseV2>[0]>(
    new URLSearchParams({
      action: "getNumberV2",
      service: input.serviceCode,
      country: String(input.countryId),
      minPrice: input.price,
      maxPrice: input.price,
      providerIds: input.providerIds,
    }),
  );

  return mapSmsBowerPurchaseV2(response);
}

export async function getSmsBowerActivationStatus(
  activationId: string,
): Promise<SmsBowerActivationStatus> {
  const text = await fetchSmsBowerText(
    new URLSearchParams({
      action: "getStatus",
      id: activationId,
    }),
  );

  return mapSmsBowerStatusText(text);
}

export async function setSmsBowerActivationStatus(input: {
  activationId: string;
  status: "3" | "6" | "8";
}): Promise<void> {
  await fetchSmsBowerText(
    new URLSearchParams({
      action: "setStatus",
      id: input.activationId,
      status: input.status,
    }),
  );
}

export async function syncSmsBowerActivations(
  records: SmsBowerActivationRecord[],
): Promise<Array<SmsBowerActivationStatus & { activationId: string }>> {
  const updates = [];

  for (const record of records) {
    const status = await getSmsBowerActivationStatus(record.activation_id);
    updates.push({
      activationId: record.activation_id,
      ...status,
    });
  }

  return updates;
}
