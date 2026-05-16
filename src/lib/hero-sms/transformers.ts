import type {
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferView,
  HeroSmsServiceOption,
} from "./types";

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

function formatNumericString(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("HeroSMS 返回了空数值");
  }

  return trimmed;
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
