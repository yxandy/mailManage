import { getRequiredEnv } from "../env.ts";

import type {
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferView,
  HeroSmsServiceOption,
} from "./types";

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

function formatNumericString(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("HeroSMS 返回了空数值");
  }

  return trimmed;
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

export function parseHeroSmsBalance(text: string): HeroSmsBalanceView {
  const prefix = "ACCESS_BALANCE:";

  if (!text.startsWith(prefix)) {
    throw new Error(`HeroSMS 余额返回异常：${text}`);
  }

  return {
    balance: formatNumericString(text.slice(prefix.length)),
  };
}

export function mapHeroSmsServices(response: HeroSmsServiceListResponse): HeroSmsServiceOption[] {
  if (response.status !== "success" || !Array.isArray(response.services)) {
    throw new Error("HeroSMS 服务列表返回异常");
  }

  return response.services
    .filter((item) => item.code && item.name)
    .map((item) => ({
      code: item.code as string,
      name: item.name as string,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function mapHeroSmsCountries(response: HeroSmsCountryMap): HeroSmsCountryOption[] {
  return Object.entries(response)
    .map(([id, item]) => ({
      id: Number(id),
      name: item.chn || item.eng || `国家 ${id}`,
      visible: item.visible ?? 0,
    }))
    .filter((item) => Number.isFinite(item.id) && item.visible === 1)
    .map(({ visible: _visible, ...country }) => country)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function mapHeroSmsOffer(
  response: HeroSmsOffersResponse,
  service: string,
  country: number,
): HeroSmsOfferView | null {
  const serviceEntry = response.data?.[service];

  if (!serviceEntry) {
    return null;
  }

  const offer = serviceEntry[String(country)];

  if (!offer?.prices || !offer.counts) {
    return null;
  }

  const min = offer.prices.min;
  const defaultPrice = offer.prices.default;
  const retail = offer.prices.retail;

  if (
    typeof min !== "number" ||
    typeof defaultPrice !== "number" ||
    typeof retail !== "number"
  ) {
    return null;
  }

  return {
    service,
    country,
    minPrice: String(min),
    defaultPrice: String(defaultPrice),
    retailPrice: String(retail),
    totalCount: offer.counts.total ?? 0,
    physicalCount: offer.counts.physical ?? 0,
    defaultPriceCount: offer.counts.defaultPrice ?? 0,
  };
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
