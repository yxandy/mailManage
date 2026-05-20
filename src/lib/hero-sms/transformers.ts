import type {
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferOperatorView,
  HeroSmsOfferView,
  HeroSmsOperatorOption,
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
  map?: Record<string, number>;
};

type HeroSmsOffersResponse = {
  data?: Record<string, Record<string, HeroSmsOfferBucket>>;
};

type HeroSmsWebOfferOperator = {
  name?: string;
  localName?: string;
  activationsCount?: number;
  countPhysical?: number;
  freePriceOffers?: Record<string, number> | null;
};

type HeroSmsWebOfferBucket = {
  operators?: HeroSmsWebOfferOperator[];
  activationFinishTime?: number;
  userPrice?: number;
  freePrice?: number;
};

type HeroSmsWebOffersResponse = {
  data?: Record<string, HeroSmsWebOfferBucket>;
};

type HeroSmsOperatorResponse = {
  status?: string;
  countryOperators?: Record<string, string[]>;
};

function formatNumericString(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("HeroSMS 返回了空数值");
  }

  return trimmed;
}

function normalizePriceKey(value: string | number): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value).trim();
  }

  return numericValue.toFixed(4);
}

function mapPriceOffers(
  priceOffers: Record<string, number> | null | undefined,
): Array<{ price: string; count: number }> {
  return Object.entries(priceOffers ?? {})
    .map(([price, count]) => ({
      price: normalizePriceKey(price),
      numericPrice: Number(price),
      count,
    }))
    .filter(
      (item) =>
        item.price &&
        Number.isFinite(item.numericPrice) &&
        typeof item.count === "number" &&
        Number.isFinite(item.count),
    )
    .sort((a, b) => a.numericPrice - b.numericPrice)
    .map(({ price, count }) => ({ price, count }));
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
  const tierPrices = Object.entries(offer.map ?? {})
    .map(([price, count]) => ({
      price: price.trim(),
      numericPrice: Number(price),
      count,
    }))
    .filter(
      (item) =>
        item.price &&
        Number.isFinite(item.numericPrice) &&
        typeof item.count === "number" &&
        Number.isFinite(item.count),
    )
    .sort((a, b) => a.numericPrice - b.numericPrice);
  const tierMinPrice = tierPrices[0]?.numericPrice;

  if (
    typeof min !== "number" ||
    typeof defaultPrice !== "number" ||
    typeof tierMinPrice !== "number"
  ) {
    return null;
  }

  return {
    service,
    country,
    minPrice: String(min),
    defaultPrice: String(defaultPrice),
    tierMinPrice: String(tierMinPrice),
    tierPrices: tierPrices.map((item) => ({
      price: item.price,
      count: item.count,
    })),
    totalCount: offer.counts.total ?? 0,
    physicalCount: offer.counts.physical ?? 0,
    defaultPriceCount: offer.counts.defaultPrice ?? 0,
    operators: [],
  };
}

export function mapHeroSmsWebOffer(
  response: HeroSmsWebOffersResponse,
  service: string,
  country: number,
): HeroSmsOfferView | null {
  const offer = response.data?.[service];

  if (!offer || !Array.isArray(offer.operators)) {
    return null;
  }

  const operators = offer.operators
    .filter((item) => typeof item.name === "string" && item.name.trim())
    .map((item): HeroSmsOfferOperatorView => {
      const code = item.name?.trim() ?? "";
      const tierPrices = mapPriceOffers(item.freePriceOffers);

      return {
        code,
        name: item.localName?.trim() || code,
        totalCount: item.activationsCount ?? 0,
        physicalCount: item.countPhysical ?? 0,
        personalMinCount: item.freePriceOffers?.[normalizePriceKey(offer.userPrice ?? 0)] ?? 0,
        tierPrices,
      };
    });
  const anyOperator = operators.find((item) => item.code === "any") ?? operators[0];
  const tierPrices = anyOperator?.tierPrices ?? [];
  const tierMinPrice = tierPrices[0]?.price;
  const userPrice = typeof offer.userPrice === "number" ? offer.userPrice : undefined;
  const minPrice = userPrice === undefined ? tierMinPrice : String(userPrice);

  if (!minPrice || !tierMinPrice) {
    return null;
  }

  return {
    service,
    country,
    minPrice,
    defaultPrice: minPrice,
    tierMinPrice,
    tierPrices,
    totalCount: anyOperator?.totalCount ?? 0,
    physicalCount: anyOperator?.physicalCount ?? 0,
    defaultPriceCount: anyOperator?.personalMinCount ?? 0,
    operators,
  };
}

export function mapHeroSmsOperators(
  response: HeroSmsOperatorResponse,
  country: number,
): HeroSmsOperatorOption[] {
  if (response.status !== "success") {
    throw new Error("HeroSMS 运营商列表返回异常");
  }

  const operators = response.countryOperators?.[String(country)];

  if (!Array.isArray(operators)) {
    return [];
  }

  return operators
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => {
      const code = item.trim();

      return {
        code,
        name: code,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}
