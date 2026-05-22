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
      code: item.code as string,
      name: item.name as string,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
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
        serviceCode: input.serviceCode,
        countryId: Number(countryId),
        countryName: countryNameById.get(countryId) ?? `国家 ${countryId}`,
        providerId,
        price: normalizePrice(numericPrice),
        count,
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
