import { getRequiredEnv } from "../env";

import {
  mapSmsBowerCountries,
  mapSmsBowerPricesV3,
  mapSmsBowerPurchaseV2,
  mapSmsBowerServices,
} from "./transformers";
import type {
  SmsBowerCountryOption,
  SmsBowerPriceResult,
  SmsBowerPurchaseResult,
  SmsBowerServiceOption,
} from "./types";

const SMS_BOWER_COMPAT_BASE_URL = "https://smsbower.page/stubs/handler_api.php";

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
    throw new Error("SMS Bower 当前没有符合条件的号码");
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

export async function getSmsBowerOptions(): Promise<{
  services: SmsBowerServiceOption[];
  countries: SmsBowerCountryOption[];
}> {
  const [servicesResponse, countriesResponse] = await Promise.all([
    fetchSmsBowerJson<Parameters<typeof mapSmsBowerServices>[0]>(
      new URLSearchParams({
        action: "getServicesList",
        lang: "cn",
      }),
    ),
    fetchSmsBowerJson<Parameters<typeof mapSmsBowerCountries>[0]>(
      new URLSearchParams({
        action: "getCountries",
      }),
    ),
  ]);

  return {
    services: mapSmsBowerServices(servicesResponse),
    countries: mapSmsBowerCountries(countriesResponse),
  };
}

export async function searchSmsBowerPrices(input: {
  serviceCode: string;
  minPrice: number;
  maxPrice: number;
  countries: SmsBowerCountryOption[];
}): Promise<SmsBowerPriceResult[]> {
  const response = await fetchSmsBowerJson<Parameters<typeof mapSmsBowerPricesV3>[0]["response"]>(
    new URLSearchParams({
      action: "getPricesV3",
      service: input.serviceCode,
    }),
  );

  return mapSmsBowerPricesV3({
    response,
    serviceCode: input.serviceCode,
    countries: input.countries,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
  });
}

export async function purchaseSmsBowerNumber(input: {
  serviceCode: string;
  countryId: number;
  price: string;
  providerId: string;
}): Promise<SmsBowerPurchaseResult> {
  const response = await fetchSmsBowerJson<Parameters<typeof mapSmsBowerPurchaseV2>[0]>(
    new URLSearchParams({
      action: "getNumberV2",
      service: input.serviceCode,
      country: String(input.countryId),
      minPrice: input.price,
      maxPrice: input.price,
      providerIds: input.providerId,
    }),
  );

  return mapSmsBowerPurchaseV2(response);
}
