import { getRequiredEnv } from "../env";

import type {
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferView,
  HeroSmsOperatorOption,
  HeroSmsPurchaseErrorView,
  HeroSmsPurchaseResultView,
  HeroSmsServiceOption,
} from "./types";
import {
  mapHeroSmsCountries,
  mapHeroSmsOffer,
  mapHeroSmsOperators,
  mapHeroSmsServices,
  parseHeroSmsBalance,
} from "./transformers";

const HERO_SMS_COMPAT_BASE_URL = "https://hero-sms.com/stubs/handler_api.php";
const HERO_SMS_REST_BASE_URL = "https://hero-sms.com/api/v1";

type HeroSmsServiceListResponse = {
  status?: string;
  services?: Array<{
    code?: string;
    name?: string;
  }>;
};

type HeroSmsCountryMap = Record<
  string,
  {
    chn?: string;
    eng?: string;
    visible?: number;
  }
>;

type HeroSmsOfferBucket = {
  prices?: {
    min?: number;
    default?: number;
    retail?: number;
  };
  counts?: {
    total?: number;
    physical?: number;
    defaultPrice?: number;
  };
};

type HeroSmsOffersResponse = {
  data?: Record<string, Record<string, HeroSmsOfferBucket>>;
};

type HeroSmsPurchaseSuccessResponse = {
  activationId?: string;
  phoneNumber?: string;
  activationCost?: number;
  currency?: number;
  countryCode?: number;
  countryPhoneCode?: number;
  canGetAnotherSms?: boolean;
  activationTime?: string;
  activationEndTime?: string;
  activationOperator?: string;
};

type HeroSmsStructuredErrorResponse = {
  title?: string;
  details?: string;
  info?: {
    min?: number;
  };
};

function getHeroSmsApiKey(): string {
  return getRequiredEnv("HERO_SMS_API_KEY");
}

async function fetchCompatText(params: URLSearchParams): Promise<string> {
  params.set("api_key", getHeroSmsApiKey());

  const response = await fetch(`${HERO_SMS_COMPAT_BASE_URL}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HeroSMS 请求失败：${response.status}`);
  }

  return text.trim();
}

async function fetchCompatJson<T>(params: URLSearchParams): Promise<T> {
  const text = await fetchCompatText(params);

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`HeroSMS 返回了无法解析的 JSON：${text}`);
  }
}

async function fetchCompatAny(
  params: URLSearchParams,
): Promise<{ text: string; json: HeroSmsStructuredErrorResponse | null }> {
  const text = await fetchCompatText(params);

  try {
    return {
      text,
      json: JSON.parse(text) as HeroSmsStructuredErrorResponse,
    };
  } catch {
    return {
      text,
      json: null,
    };
  }
}

async function fetchRestJson<T>(pathname: string): Promise<T> {
  const response = await fetch(`${HERO_SMS_REST_BASE_URL}${pathname}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `ApiKey ${getHeroSmsApiKey()}`,
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HeroSMS 请求失败：${response.status}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`HeroSMS 返回了无法解析的 JSON：${text}`);
  }
}

export async function getHeroSmsBalance(): Promise<HeroSmsBalanceView> {
  const text = await fetchCompatText(
    new URLSearchParams({
      action: "getBalance",
    }),
  );

  return parseHeroSmsBalance(text);
}

export async function getHeroSmsOptions(): Promise<{
  services: HeroSmsServiceOption[];
  countries: HeroSmsCountryOption[];
}> {
  const [servicesResponse, countriesResponse] = await Promise.all([
    fetchCompatJson<HeroSmsServiceListResponse>(
      new URLSearchParams({
        action: "getServicesList",
        lang: "cn",
      }),
    ),
    fetchCompatJson<HeroSmsCountryMap>(
      new URLSearchParams({
        action: "getCountries",
      }),
    ),
  ]);

  return {
    services: mapHeroSmsServices(servicesResponse),
    countries: mapHeroSmsCountries(countriesResponse),
  };
}

export async function getHeroSmsOperators(country: number): Promise<HeroSmsOperatorOption[]> {
  const response = await fetchCompatJson<{
    status?: string;
    countryOperators?: Record<string, string[]>;
  }>(
    new URLSearchParams({
      action: "getOperators",
      country: String(country),
    }),
  );

  return mapHeroSmsOperators(response, country);
}

export async function getHeroSmsOffer(
  service: string,
  country: number,
): Promise<HeroSmsOfferView | null> {
  const params = new URLSearchParams({
    services: service,
    countries: String(country),
  });
  const response = await fetchRestJson<HeroSmsOffersResponse>(
    `/activations/offers?${params.toString()}`,
  );

  return mapHeroSmsOffer(response, service, country);
}

export async function purchaseHeroSmsNumber(input: {
  service: string;
  country: number;
  maxPrice: string;
  operator?: string;
}): Promise<HeroSmsPurchaseResultView> {
  const params = new URLSearchParams({
    action: "getNumberV2",
    service: input.service,
    country: String(input.country),
    maxPrice: input.maxPrice,
  });

  if (input.operator?.trim()) {
    params.set("operator", input.operator.trim());
  }

  const { text, json } = await fetchCompatAny(params);

  if (json && json.title) {
    const error: HeroSmsPurchaseErrorView = {
      title: json.title,
      details: json.details ?? "",
      minPrice: typeof json.info?.min === "number" ? String(json.info.min) : undefined,
    };
    const minInfo = error.minPrice ? `，最低可接受价格：${error.minPrice}` : "";

    throw new Error(`${error.title}${error.details ? `：${error.details}` : ""}${minInfo}`);
  }

  let result: HeroSmsPurchaseSuccessResponse;

  try {
    result = JSON.parse(text) as HeroSmsPurchaseSuccessResponse;
  } catch {
    throw new Error(`HeroSMS 返回了无法解析的购买结果：${text}`);
  }

  if (
    !result.activationId ||
    !result.phoneNumber ||
    typeof result.activationCost !== "number" ||
    typeof result.currency !== "number" ||
    typeof result.countryCode !== "number" ||
    typeof result.countryPhoneCode !== "number" ||
    typeof result.canGetAnotherSms !== "boolean" ||
    !result.activationTime ||
    !result.activationEndTime ||
    !result.activationOperator
  ) {
    throw new Error(`HeroSMS 返回了不完整的购买结果：${text}`);
  }

  return {
    activationId: result.activationId,
    phoneNumber: result.phoneNumber,
    activationCost: String(result.activationCost),
    currency: result.currency,
    countryCode: result.countryCode,
    countryPhoneCode: result.countryPhoneCode,
    canGetAnotherSms: result.canGetAnotherSms,
    activationTime: result.activationTime,
    activationEndTime: result.activationEndTime,
    activationOperator: result.activationOperator,
  };
}
