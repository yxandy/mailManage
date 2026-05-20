import { requireSession } from "@/lib/auth/auth";
import {
  mapHeroSmsActivationRecordToView,
  mapHeroSmsFavoriteRecordToView,
  mapHeroSmsPriceMonitorRecordToView,
} from "@/lib/hero-sms/activations";
import { getHeroSmsBalance, getHeroSmsOptions } from "@/lib/hero-sms/client";
import {
  getHeroSmsCostSummary,
  listActiveHeroSmsActivations,
  listHeroSmsFavorites,
  listHeroSmsPriceMonitors,
} from "@/lib/hero-sms/repository";

import { HeroSmsReadonlyClient } from "@/components/hero-sms-readonly-client";

export default async function HeroSmsPage() {
  await requireSession();

  const [balance, costSummary, options, activations, favorites, priceMonitors] = await Promise.all([
    getHeroSmsBalance(),
    getHeroSmsCostSummary(),
    getHeroSmsOptions(),
    listActiveHeroSmsActivations(),
    listHeroSmsFavorites(),
    listHeroSmsPriceMonitors(),
  ]);

  return (
    <HeroSmsReadonlyClient
      initialBalance={balance}
      initialCostSummary={costSummary}
      initialServices={options.services}
      initialCountries={options.countries}
      initialActivations={activations.map(mapHeroSmsActivationRecordToView)}
      initialFavorites={favorites.map(mapHeroSmsFavoriteRecordToView)}
      initialPriceMonitors={priceMonitors.map(mapHeroSmsPriceMonitorRecordToView)}
    />
  );
}
