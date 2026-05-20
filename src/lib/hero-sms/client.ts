import { getRequiredEnv } from "../env";

import type {
  HeroSmsActivationRecord,
  HeroSmsActiveActivationItem,
  HeroSmsActivationHistoryRawItem,
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferView,
  HeroSmsPurchaseErrorCode,
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
  mapHeroSmsWebOffer,
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

type HeroSmsWebOffersResponse = {
  data?: Record<
    string,
    {
      operators?: Array<{
        name?: string;
        localName?: string;
        activationsCount?: number;
        countPhysical?: number;
        freePriceOffers?: Record<string, number> | null;
      }>;
      activationFinishTime?: number;
      userPrice?: number;
      freePrice?: number;
    }
  >;
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
    retry_after_seconds?: number;
  };
};

type HeroSmsActiveActivationsResponse = {
  status?: string;
  data?: HeroSmsActiveActivationItem[];
};

type HeroSmsActivationHistoryResponse = HeroSmsActivationHistoryRawItem[];

type HeroSmsCompatRawResponse = {
  status: number;
  text: string;
};

export class HeroSmsPurchaseError extends Error {
  readonly payload: HeroSmsPurchaseErrorView;

  constructor(payload: HeroSmsPurchaseErrorView) {
    super(payload.message);
    this.name = "HeroSmsPurchaseError";
    this.payload = payload;
  }
}

export class HeroSmsActivationActionError extends Error {
  readonly code: string;
  readonly details: string;

  constructor(input: { code: string; details?: string; message: string }) {
    super(input.message);
    this.name = "HeroSmsActivationActionError";
    this.code = input.code;
    this.details = input.details ?? "";
  }
}

const HERO_SMS_PURCHASE_ERROR_MESSAGES: Record<HeroSmsPurchaseErrorCode, string> = {
  NO_NUMBERS: "当前号码池暂时没有可售号码，系统可以稍后重试。",
  WRONG_MAX_PRICE: "当前出价低于平台可接受价格，请提高价格后再试。",
  NO_BALANCE: "HeroSMS 余额不足，请先充值后再试。",
  WRONG_COUNTRY: "国家参数无效，请重新选择国家。",
  WRONG_SERVICE: "服务参数无效，请重新选择服务。",
  WRONG_CURRENCY: "当前货币参数不受支持。",
  UNPROCESSABLE_ENTITY: "请求参数不完整或格式不正确。",
  BAD_KEY: "HeroSMS API Key 无效，请检查服务端配置。",
  ACCOUNT_INACTIVE: "HeroSMS 账户尚未激活。",
  BANNED: "HeroSMS 账户当前被限制购买，请稍后再试。",
  SERVICE_NOT_AVAILABLE: "当前服务暂不可售，请更换服务或稍后再试。",
  CHANNELS_LIMIT: "HeroSMS 并发购买线程已达上限，请稍后再试。",
  SERVER_ERROR: "HeroSMS 服务暂时异常，请稍后再试。",
  BAD_ACTION: "HeroSMS 接口动作无效。",
  UNKNOWN: "HeroSMS 返回了未识别的购买错误。",
};

const HERO_SMS_ACTIVATION_ACTION_ERROR_MESSAGES: Record<string, string> = {
  EARLY_CANCEL_DENIED: "购买后 2 分钟内不可取消，请稍后再试。",
  OTP_RECEIVED: "号码已返回短信内容，不允许取消。",
  NEW_OTP_RECEIVED: "号码已返回新的短信内容，不允许取消。",
  FREE_CANCELLATION_EXPIRED: "免费取消时间已过，平台不允许取消。",
  ACTIVATION_NOT_ACTIVE: "该号码已不在活动状态，无法继续操作。",
  NOT_FOUND: "未找到对应的 HeroSMS 激活记录。",
};

function normalizePurchaseErrorCode(value: string): HeroSmsPurchaseErrorCode {
  switch (value) {
    case "NO_NUMBERS":
    case "WRONG_MAX_PRICE":
    case "NO_BALANCE":
    case "WRONG_COUNTRY":
    case "WRONG_SERVICE":
    case "WRONG_CURRENCY":
    case "UNPROCESSABLE_ENTITY":
    case "BAD_KEY":
    case "ACCOUNT_INACTIVE":
    case "BANNED":
    case "SERVICE_NOT_AVAILABLE":
    case "CHANNELS_LIMIT":
    case "SERVER_ERROR":
    case "BAD_ACTION":
      return value;
    default:
      return "UNKNOWN";
  }
}

function buildPurchaseError(params: {
  code: string;
  details?: string;
  minPrice?: string;
  retryAfterSeconds?: number;
  raw: string;
}): HeroSmsPurchaseError {
  const code = normalizePurchaseErrorCode(params.code);
  const minInfo = params.minPrice ? ` 最低可接受价格：${params.minPrice}。` : "";
  const retryInfo =
    typeof params.retryAfterSeconds === "number" && params.retryAfterSeconds > 0
      ? ` 建议 ${params.retryAfterSeconds} 秒后再试。`
      : "";
  const details = params.details?.trim() ?? "";
  const suffix = details ? `（${details}）` : "";
  const message = `${HERO_SMS_PURCHASE_ERROR_MESSAGES[code]}${minInfo}${retryInfo}${suffix}`.trim();

  return new HeroSmsPurchaseError({
    code,
    title: code,
    details,
    message,
    minPrice: params.minPrice,
    retryAfterSeconds: params.retryAfterSeconds,
    retryable: code === "NO_NUMBERS",
    raw: params.raw,
  });
}

function getHeroSmsApiKey(): string {
  return getRequiredEnv("HERO_SMS_API_KEY");
}

function parseCompatStructuredError(text: string): HeroSmsStructuredErrorResponse | null {
  try {
    return JSON.parse(text) as HeroSmsStructuredErrorResponse;
  } catch {
    return null;
  }
}

function buildCompatHttpError(status: number, text: string): Error {
  const json = parseCompatStructuredError(text);

  if (json?.title) {
    const details = json.details?.trim() ? `：${json.details.trim()}` : "";
    return new Error(`HeroSMS 请求失败：${status}（${json.title}${details}）`);
  }

  return new Error(`HeroSMS 请求失败：${status}${text ? `（${text}）` : ""}`);
}

function buildActivationActionError(json: HeroSmsStructuredErrorResponse): HeroSmsActivationActionError {
  const code = json.title ?? "UNKNOWN";
  const fallback = json.details?.trim() || "HeroSMS 拒绝了本次操作。";

  return new HeroSmsActivationActionError({
    code,
    details: json.details ?? "",
    message: HERO_SMS_ACTIVATION_ACTION_ERROR_MESSAGES[code] ?? fallback,
  });
}

async function fetchCompatRaw(params: URLSearchParams): Promise<HeroSmsCompatRawResponse> {
  params.set("api_key", getHeroSmsApiKey());

  const response = await fetch(`${HERO_SMS_COMPAT_BASE_URL}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const text = await response.text();

  return {
    status: response.status,
    text: text.trim(),
  };
}

async function fetchCompatText(params: URLSearchParams): Promise<string> {
  const result = await fetchCompatRaw(params);

  if (result.status < 200 || result.status >= 300) {
    throw buildCompatHttpError(result.status, result.text);
  }

  return result.text;
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
): Promise<{ status: number; text: string; json: HeroSmsStructuredErrorResponse | null }> {
  const result = await fetchCompatRaw(params);

  return {
    status: result.status,
    text: result.text,
    json: parseCompatStructuredError(result.text),
  };
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
  const response = await fetchRestJson<HeroSmsWebOffersResponse>(
    `/left-menu/service/${encodeURIComponent(service)}/country/${encodeURIComponent(String(country))}/offers`,
  );

  return mapHeroSmsWebOffer(response, service, country);
}

export async function getLegacyHeroSmsOffer(
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

  const { status, text, json } = await fetchCompatAny(params);

  if (status < 200 || status >= 300) {
    if (json?.title) {
      throw buildPurchaseError({
        code: json.title,
        details: json.details ?? "",
        minPrice: typeof json.info?.min === "number" ? String(json.info.min) : undefined,
        retryAfterSeconds:
          typeof json.info?.retry_after_seconds === "number"
            ? json.info.retry_after_seconds
            : undefined,
        raw: text,
      });
    }

    throw buildPurchaseError({
      code: "UNKNOWN",
      details: `HTTP ${status}`,
      raw: text,
    });
  }

  if (json && json.title) {
    throw buildPurchaseError({
      code: json.title,
      details: json.details ?? "",
      minPrice: typeof json.info?.min === "number" ? String(json.info.min) : undefined,
      retryAfterSeconds:
        typeof json.info?.retry_after_seconds === "number"
          ? json.info.retry_after_seconds
          : undefined,
      raw: text,
    });
  }

  const plainErrorCode = text.split(":")[0]?.trim() ?? "";

  if (/^[A-Z_]+$/.test(plainErrorCode) && plainErrorCode !== "ACCESS_NUMBER") {
    throw buildPurchaseError({
      code: plainErrorCode,
      raw: text,
    });
  }

  let result: HeroSmsPurchaseSuccessResponse;

  try {
    result = JSON.parse(text) as HeroSmsPurchaseSuccessResponse;
  } catch {
    throw buildPurchaseError({
      code: "UNKNOWN",
      details: "购买结果无法解析",
      raw: text,
    });
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

export async function getHeroSmsActiveActivations(): Promise<HeroSmsActiveActivationItem[]> {
  const response = await fetchCompatJson<HeroSmsActiveActivationsResponse>(
    new URLSearchParams({
      action: "getActiveActivations",
    }),
  );

  if (response.status !== "success" || !Array.isArray(response.data)) {
    throw new Error("HeroSMS 活动列表返回异常");
  }

  return response.data;
}

export async function getHeroSmsActivationHistory(input: {
  start: number;
  end: number;
  offset?: number;
  size?: number;
}): Promise<HeroSmsActivationHistoryRawItem[]> {
  const response = await fetchCompatJson<HeroSmsActivationHistoryResponse>(
    new URLSearchParams({
      action: "getHistory",
      start: String(input.start),
      end: String(input.end),
      offset: String(input.offset ?? 0),
      size: String(input.size ?? 100),
    }),
  );

  if (!Array.isArray(response)) {
    throw new Error("HeroSMS 历史记录返回异常");
  }

  return response;
}

async function runHeroSmsActivationAction(
  action: "cancelActivation" | "finishActivation",
  activationId: string,
): Promise<void> {
  const { text, json } = await fetchCompatAny(
    new URLSearchParams({
      action,
      id: activationId,
    }),
  );

  if (json?.title) {
    throw buildActivationActionError(json);
  }

  if (text && text !== "OK") {
    throw new Error(`HeroSMS ${action} 返回异常：${text}`);
  }
}

async function setHeroSmsActivationStatus(
  activationId: string,
  status: 3 | 6 | 8,
): Promise<void> {
  const { text, json } = await fetchCompatAny(
    new URLSearchParams({
      action: "setStatus",
      id: activationId,
      status: String(status),
    }),
  );

  if (json?.title) {
    throw buildActivationActionError(json);
  }

  const expected =
    status === 3 ? "ACCESS_RETRY_GET" : status === 6 ? "ACCESS_ACTIVATION" : "ACCESS_CANCEL";

  if (text && text !== expected) {
    throw new Error(`HeroSMS setStatus 返回异常：${text}`);
  }
}

export async function cancelHeroSmsActivation(activationId: string): Promise<void> {
  await runHeroSmsActivationAction("cancelActivation", activationId);
}

export async function finishHeroSmsActivation(activationId: string): Promise<void> {
  await runHeroSmsActivationAction("finishActivation", activationId);
}

export async function requestAnotherHeroSms(activationId: string): Promise<void> {
  await setHeroSmsActivationStatus(activationId, 3);
}

export async function syncHeroSmsActivations(
  records: HeroSmsActivationRecord[],
): Promise<Array<{ activationId: string; activationStatus: string | null; smsCode: string | null; smsText: string | null; isActive: boolean }>> {
  const activeMap = new Map(
    (await getHeroSmsActiveActivations())
      .filter((item) => item.activationId !== undefined && item.activationId !== null)
      .map((item) => [String(item.activationId), item]),
  );

  return records.map((record) => {
    const current = activeMap.get(record.activation_id);

    if (!current) {
      return {
        activationId: record.activation_id,
        activationStatus: record.activation_status,
        smsCode: record.sms_code,
        smsText: record.sms_text,
        isActive: false,
      };
    }

    return {
      activationId: record.activation_id,
      activationStatus:
        current.activationStatus === undefined || current.activationStatus === null
          ? record.activation_status
          : String(current.activationStatus),
      smsCode:
        current.activationStatus === 3 || String(current.activationStatus ?? "") === "3"
          ? null
          : current.smsCode ?? record.sms_code,
      smsText:
        current.activationStatus === 3 || String(current.activationStatus ?? "") === "3"
          ? null
          : current.smsText ?? record.sms_text,
      isActive: true,
    };
  });
}
