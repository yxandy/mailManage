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
  retailPrice: string;
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

export type HeroSmsPurchaseErrorView = {
  title: string;
  details: string;
  minPrice?: string;
};
