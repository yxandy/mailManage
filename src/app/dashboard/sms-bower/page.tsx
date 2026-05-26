import { requireSession } from "@/lib/auth/auth";
import { getSmsBowerOptions } from "@/lib/sms-bower/client";
import {
  mapSmsBowerActivationRecordToView,
  mapSmsBowerCountryFavoriteRecordToView,
  mapSmsBowerFavoriteRecordToView,
} from "@/lib/sms-bower/activations";
import {
  listActiveSmsBowerActivations,
  listSmsBowerCountryFavorites,
  listSmsBowerFavorites,
} from "@/lib/sms-bower/repository";

import { SmsBowerClient } from "@/components/sms-bower-client";

export default async function SmsBowerPage() {
  await requireSession();

  const [options, activations, favorites, countryFavorites] = await Promise.all([
    getSmsBowerOptions(),
    listActiveSmsBowerActivations(),
    listSmsBowerFavorites(),
    listSmsBowerCountryFavorites(),
  ]);

  return (
    <SmsBowerClient
      initialServices={options.services}
      initialCountries={[]}
      initialActivations={activations.map(mapSmsBowerActivationRecordToView)}
      initialFavorites={favorites.map(mapSmsBowerFavoriteRecordToView)}
      initialCountryFavorites={countryFavorites.map(mapSmsBowerCountryFavoriteRecordToView)}
    />
  );
}
