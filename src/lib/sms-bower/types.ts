export type SmsBowerServiceOption = {
  id: number | null;
  code: string;
  name: string;
};

export type SmsBowerCountryOption = {
  id: number;
  name: string;
};

export type SmsBowerPriceResult = {
  id: string;
  serviceId: number;
  serviceCode: string;
  countryId: number;
  countryCode: number;
  countryName: string;
  countryType: "virtual" | "normal";
  providerId: string;
  providerIds: string;
  providerCount: number;
  price: string;
  count: number;
  countLabel: string;
  rankId: number | null;
  rank: string;
};

export type SmsBowerPurchaseResult = {
  activationId: string;
  phoneNumber: string;
  activationCost: string;
  countryCode: number | null;
  countryPhoneCode: number | null;
  activationTime: string | null;
  activationOperator: string | null;
  canGetAnotherSms: boolean;
};

export type SmsBowerActivationStatus = {
  activationStatus: string;
  smsCode: string | null;
  isActive: boolean;
};

export type SmsBowerActivationRecord = {
  id: string;
  activation_id: string;
  phone_number: string;
  service_code: string;
  service_name: string;
  country_id: number;
  country_name: string;
  country_phone_code: number | null;
  provider_id: string | null;
  provider_ids: string;
  activation_cost: string;
  activation_operator: string | null;
  can_get_another_sms: boolean;
  activation_time: string | null;
  activation_status: string;
  sms_code: string | null;
  sms_text: string | null;
  last_sms_code: string | null;
  last_sms_text: string | null;
  is_active: boolean;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SmsBowerActivationView = {
  id: string;
  activationId: string;
  phoneNumber: string;
  serviceName: string;
  serviceCode: string;
  countryName: string;
  countryId: number;
  countryPhoneCode: number | null;
  providerId: string;
  providerIds: string;
  activationCost: string;
  activationOperator: string;
  canGetAnotherSms: boolean;
  activationTime: string | null;
  activationStatus: string;
  activationStatusText: string;
  smsCode: string | null;
  smsText: string | null;
  lastSmsCode: string | null;
  lastSmsText: string | null;
  isActive: boolean;
  createdAt: string;
};

export type SmsBowerFavoriteRecord = {
  id: string;
  service_id: number;
  service_code: string;
  service_name: string;
  min_price: string;
  max_price: string;
  rank_ids: number[];
  early_retry_minutes: number;
  early_retry_interval_seconds: number;
  later_retry_interval_seconds: number;
  max_wait_minutes: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SmsBowerFavoriteView = {
  id: string;
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  minPrice: string;
  maxPrice: string;
  rankIds: number[];
  earlyRetryMinutes: number;
  earlyRetryIntervalSeconds: number;
  laterRetryIntervalSeconds: number;
  maxWaitMinutes: number;
};

export type SmsBowerCountryFavoriteRecord = {
  id: string;
  country_id: number;
  country_name: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SmsBowerCountryFavoriteView = {
  id: string;
  countryId: number;
  countryName: string;
};

export type SmsBowerWebhookPayload = {
  activationId?: string | number;
  service?: string;
  text?: string;
  code?: string | number;
  country?: string | number;
  receivedAt?: string;
};
