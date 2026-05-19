export type HeroSmsBalanceView = {
  balance: string;
};

export type HeroSmsServiceOption = {
  code: string;
  name: string;
};

export type HeroSmsCountryOption = {
  id: number;
  name: string;
};

export type HeroSmsOperatorOption = {
  code: string;
  name: string;
};

export type HeroSmsOfferView = {
  service: string;
  country: number;
  minPrice: string;
  defaultPrice: string;
  tierMinPrice: string;
  tierPrices: Array<{
    price: string;
    count: number;
  }>;
  totalCount: number;
  physicalCount: number;
  defaultPriceCount: number;
};

export type HeroSmsPurchaseResultView = {
  activationId: string;
  phoneNumber: string;
  activationCost: string;
  currency: number;
  countryCode: number;
  countryPhoneCode: number;
  canGetAnotherSms: boolean;
  activationTime: string;
  activationEndTime: string;
  activationOperator: string;
};

export type HeroSmsPurchaseErrorCode =
  | "NO_NUMBERS"
  | "WRONG_MAX_PRICE"
  | "NO_BALANCE"
  | "WRONG_COUNTRY"
  | "WRONG_SERVICE"
  | "WRONG_CURRENCY"
  | "UNPROCESSABLE_ENTITY"
  | "BAD_KEY"
  | "ACCOUNT_INACTIVE"
  | "BANNED"
  | "SERVICE_NOT_AVAILABLE"
  | "CHANNELS_LIMIT"
  | "SERVER_ERROR"
  | "BAD_ACTION"
  | "UNKNOWN";

export type HeroSmsPurchaseErrorView = {
  code: HeroSmsPurchaseErrorCode;
  title: string;
  details: string;
  message: string;
  minPrice?: string;
  retryAfterSeconds?: number;
  retryable: boolean;
  raw: string;
};

export type HeroSmsActivationRecord = {
  id: string;
  activation_id: string;
  phone_number: string;
  service_code: string;
  service_name: string;
  country_id: number;
  country_name: string;
  country_phone_code: number;
  operator_code: string;
  activation_cost: string;
  currency_code: number;
  can_get_another_sms: boolean;
  activation_time: string;
  activation_end_time: string;
  activation_status: string | null;
  sms_code: string | null;
  sms_text: string | null;
  last_sms_code: string | null;
  last_sms_text: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type HeroSmsActivationView = {
  id: string;
  activationId: string;
  phoneNumber: string;
  serviceName: string;
  countryName: string;
  countryPhoneCode: number;
  operatorCode: string;
  activationCost: string;
  currencyLabel: string;
  canGetAnotherSms: boolean;
  activationTime: string;
  activationEndTime: string;
  activationStatus: string;
  activationStatusText: string;
  smsCode: string | null;
  smsText: string | null;
  lastSmsCode: string | null;
  lastSmsText: string | null;
  isActive: boolean;
  createdAt: string;
};

export type HeroSmsActiveActivationItem = {
  activationId?: string | number;
  activationStatus?: string | number;
  smsCode?: string | null;
  smsText?: string | null;
};

export type HeroSmsActivationHistoryRawItem = Record<string, unknown> & {
  id?: string | number;
  activationId?: string | number;
  date?: string;
  phone?: string;
  phoneNumber?: string;
  sms?: string | null;
  smsText?: string | null;
  cost?: number | string;
  activationCost?: number | string;
  status?: string | number;
  activationStatus?: string | number;
  currency?: number | string;
  service?: string;
  serviceCode?: string;
  serviceName?: string;
  country?: number | string;
  countryCode?: number | string;
  countryName?: string;
  operator?: string;
  activationOperator?: string;
};

export type HeroSmsActivationHistoryRecord = {
  id: string;
  activation_id: string;
  activation_date: string | null;
  phone_number: string;
  activation_cost: string | null;
  currency_code: number | null;
  service_code: string | null;
  service_name: string | null;
  country_id: number | null;
  country_name: string | null;
  operator_code: string | null;
  activation_status: string | null;
  sms_text: string | null;
  raw_payload: HeroSmsActivationHistoryRawItem;
  synced_at: string;
  created_at: string;
  updated_at: string;
};

export type HeroSmsFavoriteRecord = {
  id: string;
  service_code: string;
  service_name: string;
  country_id: number;
  country_name: string;
  operator_code: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HeroSmsFavoriteView = {
  id: string;
  serviceCode: string;
  serviceName: string;
  countryId: number;
  countryName: string;
  operatorCode: string;
};

export type HeroSmsWebhookPayload = {
  activationId?: string | number;
  service?: string;
  text?: string;
  code?: string | number | null;
  country?: string | number;
  receivedAt?: string;
};
