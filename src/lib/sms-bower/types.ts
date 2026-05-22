export type SmsBowerServiceOption = {
  code: string;
  name: string;
};

export type SmsBowerCountryOption = {
  id: number;
  name: string;
};

export type SmsBowerPriceResult = {
  id: string;
  serviceCode: string;
  countryId: number;
  countryName: string;
  providerId: string;
  price: string;
  count: number;
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
