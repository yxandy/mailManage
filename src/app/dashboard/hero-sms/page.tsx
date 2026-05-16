import { requireSession } from "@/lib/auth/auth";
import {
  mapHeroSmsActivationRecordToView,
  mapHeroSmsFavoriteRecordToView,
} from "@/lib/hero-sms/activations";
import { getHeroSmsBalance, getHeroSmsOptions } from "@/lib/hero-sms/client";
import {
  listActiveHeroSmsActivations,
  listHeroSmsFavorites,
} from "@/lib/hero-sms/repository";

import { HeroSmsReadonlyClient } from "@/components/hero-sms-readonly-client";

export default async function HeroSmsPage() {
  await requireSession();

  const [balance, options, activations, favorites] = await Promise.all([
    getHeroSmsBalance(),
    getHeroSmsOptions(),
    listActiveHeroSmsActivations(),
    listHeroSmsFavorites(),
  ]);

  return (
    <HeroSmsReadonlyClient
      initialBalance={balance}
      initialServices={options.services}
      initialCountries={options.countries}
      initialActivations={activations.map(mapHeroSmsActivationRecordToView)}
      initialFavorites={favorites.map(mapHeroSmsFavoriteRecordToView)}
    />
  );
}
