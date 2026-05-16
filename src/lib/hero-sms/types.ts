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
