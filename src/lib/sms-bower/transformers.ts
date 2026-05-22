import type {
  SmsBowerCountryOption,
  SmsBowerPriceResult,
  SmsBowerPurchaseResult,
  SmsBowerServiceOption,
} from "./types";

type SmsBowerServiceListResponse = {
  status?: string;
  services?: Array<{
    code?: string;
    id?: number | string;
    name?: string;
  }>;
};

type SmsBowerCountryMap = Record<
  string,
  {
    chn?: string;
    eng?: string;
    visible?: number;
  }
>;

type SmsBowerPricesV3Provider = {
  count?: number | string;
  price?: number | string;
  provider_id?: number | string;
};

type SmsBowerPricesV3Response = Record<
  string,
  Record<string, Record<string, SmsBowerPricesV3Provider>>
>;

type SmsBowerFrontendPricesResponse = {
  services?: Record<
    string,
    {
      id?: number | string;
      title?: string;
      activate_org_code?: string;
      countries?: Record<
        string,
        {
          id?: number | string;
          title?: string;
          iso?: string;
          activate_org_code?: number | string;
          min_price?: number | string;
          count?: number | string;
          positions?: Record<
            string,
            {
              price?: number | string;
              count?: number | string;
              rank?: {
                id?: number | string;
                description?: string;
              };
              agent_ids?: Array<number | string>;
              agent_prices?: Record<string, number | string>;
            }
          >;
        }
      >;
    }
  >;
};

type SmsBowerFrontendServicesResponse = {
  services?: Record<
    string,
    {
      id?: number | string;
      title?: string;
      activate_org_code?: string;
    }
  >;
};

type SmsBowerPurchaseV2Response = {
  activationId?: string | number;
  phoneNumber?: string | number;
  activationCost?: string | number;
  countryCode?: string | number;
  activationTime?: string;
  activationOperator?: string;
  canGetAnotherSms?: boolean;
};

function normalizePrice(value: string | number): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return String(value).trim();
  }

  return numericValue.toFixed(4);
}

export function mapSmsBowerServices(
  response: SmsBowerServiceListResponse,
): SmsBowerServiceOption[] {
  if (response.status !== "success" || !Array.isArray(response.services)) {
    throw new Error("SMS Bower 服务列表返回异常");
  }

  return response.services
    .filter((item) => item.code && item.name)
    .map((item) => ({
      id: Number.isFinite(Number(item.id)) ? Number(item.id) : null,
      code: item.code as string,
      name: item.name as string,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function mapSmsBowerFrontendServices(
  response: SmsBowerFrontendServicesResponse,
): SmsBowerServiceOption[] {
  return Object.values(response.services ?? {})
    .map((item) => {
      const id = Number(item.id);

      return {
        id: Number.isFinite(id) ? id : null,
        code: item.activate_org_code?.trim() ?? "",
        name: item.title?.trim() ?? "",
      };
    })
    .filter((item) => item.id !== null && item.code && item.name)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function getCountryType(country: {
  title?: string;
  iso?: string;
  activate_org_code?: number | string;
}): SmsBowerPriceResult["countryType"] {
  const title = country.title?.toLowerCase() ?? "";
  const iso = country.iso?.toUpperCase() ?? "";
  const code = String(country.activate_org_code ?? "");

  if (title.includes("virtual") || iso === "UV" || code === "12") {
    return "virtual";
  }

  return "normal";
}

function getRankLabel(rank?: string): string {
  switch (rank) {
    case "gold":
      return "黄金";
    case "silver":
      return "白银";
    case "bronze":
      return "青铜";
    default:
      return "未标注";
  }
}

export function mapSmsBowerCountries(response: SmsBowerCountryMap): SmsBowerCountryOption[] {
  return Object.entries(response)
    .map(([id, item]) => ({
      id: Number(id),
      name: item.chn || item.eng || `国家 ${id}`,
      visible: item.visible ?? 1,
    }))
    .filter((item) => Number.isFinite(item.id) && item.visible === 1)
    .map((item) => ({
      id: item.id,
      name: item.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function mapSmsBowerPricesV3(input: {
  response: SmsBowerPricesV3Response;
  serviceCode: string;
  countries: SmsBowerCountryOption[];
  minPrice: number;
  maxPrice: number;
}): SmsBowerPriceResult[] {
  const countryNameById = new Map(input.countries.map((country) => [String(country.id), country.name]));
  const results: SmsBowerPriceResult[] = [];

  for (const [countryId, services] of Object.entries(input.response ?? {})) {
    const providers = services?.[input.serviceCode];

    if (!providers) {
      continue;
    }

    for (const [providerKey, item] of Object.entries(providers)) {
      const numericPrice = Number(item.price);
      const count = Number(item.count);
      const providerId = String(item.provider_id ?? providerKey).trim();

      if (
        !providerId ||
        !Number.isFinite(numericPrice) ||
        !Number.isFinite(count) ||
        count <= 0 ||
        numericPrice < input.minPrice ||
        numericPrice > input.maxPrice
      ) {
        continue;
      }

      results.push({
        id: `${countryId}:${providerId}:${normalizePrice(numericPrice)}`,
        serviceId: 0,
        serviceCode: input.serviceCode,
        countryId: Number(countryId),
        countryCode: Number(countryId),
        countryName: countryNameById.get(countryId) ?? `国家 ${countryId}`,
        countryType: "normal",
        providerId,
        price: normalizePrice(numericPrice),
        count,
        rankId: null,
        rank: "未标注",
      });
    }
  }

  return results.sort((a, b) => {
    const priceDiff = Number(a.price) - Number(b.price);

    if (priceDiff !== 0) {
      return priceDiff;
    }

    return a.countryName.localeCompare(b.countryName, "zh-CN");
  });
}

export function mapSmsBowerFrontendPrices(input: {
  response: SmsBowerFrontendPricesResponse;
  serviceId: number;
  serviceCode: string;
  minPrice: number;
  maxPrice: number;
}): SmsBowerPriceResult[] {
  const service = input.response.services?.[String(input.serviceId)];
  const results: SmsBowerPriceResult[] = [];

  if (!service?.countries) {
    return results;
  }

  for (const [countryKey, country] of Object.entries(service.countries)) {
    const countryId = Number(country.id ?? countryKey);
    const countryCode = Number(country.activate_org_code);
    const countryName = country.title?.trim() || `国家 ${countryId}`;
    const countryType = getCountryType(country);

    if (!Number.isFinite(countryId) || !Number.isFinite(countryCode)) {
      continue;
    }

    for (const [positionKey, position] of Object.entries(country.positions ?? {})) {
      const numericPrice = Number(position.price);
      const count = Number(position.count);
      const rankId = Number(position.rank?.id);
      const rank = position.rank?.description?.trim() ?? "";
      const agentIds = Array.isArray(position.agent_ids) ? position.agent_ids : [];

      if (
        !Number.isFinite(numericPrice) ||
        !Number.isFinite(count) ||
        count <= 0 ||
        numericPrice < input.minPrice ||
        numericPrice > input.maxPrice ||
        agentIds.length === 0
      ) {
        continue;
      }

      for (const agentIdValue of agentIds) {
        const providerId = String(agentIdValue).trim();
        const agentPrice = Number(position.agent_prices?.[providerId] ?? numericPrice);

        if (
          !providerId ||
          !Number.isFinite(agentPrice) ||
          agentPrice < input.minPrice ||
          agentPrice > input.maxPrice
        ) {
          continue;
        }

        results.push({
          id: `${input.serviceId}:${countryId}:${providerId}:${positionKey}:${normalizePrice(agentPrice)}`,
          serviceId: input.serviceId,
          serviceCode: service.activate_org_code?.trim() || input.serviceCode,
          countryId,
          countryCode,
          countryName,
          countryType,
          providerId,
          price: normalizePrice(agentPrice),
          count,
          rankId: Number.isFinite(rankId) ? rankId : null,
          rank: getRankLabel(rank),
        });
      }
    }
  }

  return results.sort((a, b) => {
    const priceDiff = Number(a.price) - Number(b.price);

    if (priceDiff !== 0) {
      return priceDiff;
    }

    const rankDiff = (a.rankId ?? 99) - (b.rankId ?? 99);

    if (rankDiff !== 0) {
      return rankDiff;
    }

    return a.countryName.localeCompare(b.countryName, "zh-CN");
  });
}

export function mapSmsBowerPurchaseV2(
  response: SmsBowerPurchaseV2Response,
): SmsBowerPurchaseResult {
  const activationId = String(response.activationId ?? "").trim();
  const phoneNumber = String(response.phoneNumber ?? "").trim();
  const activationCost = normalizePrice(response.activationCost ?? "");

  if (!activationId || !phoneNumber) {
    throw new Error("SMS Bower 购买返回异常");
  }

  const countryCode = Number(response.countryCode);

  return {
    activationId,
    phoneNumber,
    activationCost,
    countryCode: Number.isFinite(countryCode) ? countryCode : null,
    activationTime: response.activationTime ?? null,
    activationOperator: response.activationOperator ?? null,
    canGetAnotherSms: Boolean(response.canGetAnotherSms),
  };
}
