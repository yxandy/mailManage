import { getRequiredEnv } from "../env";

import type {
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferView,
  HeroSmsServiceOption,
} from "./types";
import {
  mapHeroSmsCountries,
  mapHeroSmsOffer,
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
