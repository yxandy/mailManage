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
  rankId: number | null;
  rank: string;
};

export type SmsBowerPurchaseResult = {
  activationId: string;
  phoneNumber: string;
  activationCost: string;
  countryCode: number | null;
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
  provider_id: string | null;
  provider_ids: string;
  activation_cost: string;
  activation_operator: string | null;
  can_get_another_sms: boolean;
  activation_time: string | null;
  activation_status: string;
  sms_code: string | null;
  sms_text: string | null;
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
  isActive: boolean;
  createdAt: string;
};

export type SmsBowerWebhookPayload = {
  activationId?: string | number;
  service?: string;
  text?: string;
  code?: string | number;
  country?: string | number;
  receivedAt?: string;
};
