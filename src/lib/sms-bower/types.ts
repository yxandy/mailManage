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
