import { requireSession } from "@/lib/auth/auth";
import { getSmsBowerOptions } from "@/lib/sms-bower/client";
import {
  mapSmsBowerActivationRecordToView,
  mapSmsBowerFavoriteRecordToView,
} from "@/lib/sms-bower/activations";
import {
  listActiveSmsBowerActivations,
  listSmsBowerFavorites,
} from "@/lib/sms-bower/repository";

import { SmsBowerClient } from "@/components/sms-bower-client";

export default async function SmsBowerPage() {
  await requireSession();

  const [options, activations, favorites] = await Promise.all([
    getSmsBowerOptions(),
    listActiveSmsBowerActivations(),
    listSmsBowerFavorites(),
  ]);

  return (
    <SmsBowerClient
      initialServices={options.services}
      initialCountries={[]}
      initialActivations={activations.map(mapSmsBowerActivationRecordToView)}
      initialFavorites={favorites.map(mapSmsBowerFavoriteRecordToView)}
    />
  );
}
