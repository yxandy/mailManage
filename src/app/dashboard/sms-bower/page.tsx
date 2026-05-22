import { requireSession } from "@/lib/auth/auth";
import { getSmsBowerOptions } from "@/lib/sms-bower/client";
import { mapSmsBowerActivationRecordToView } from "@/lib/sms-bower/activations";
import { listActiveSmsBowerActivations } from "@/lib/sms-bower/repository";

import { SmsBowerClient } from "@/components/sms-bower-client";

export default async function SmsBowerPage() {
  await requireSession();

  const [options, activations] = await Promise.all([
    getSmsBowerOptions(),
    listActiveSmsBowerActivations(),
  ]);

  return (
    <SmsBowerClient
      initialServices={options.services}
      initialCountries={[]}
      initialActivations={activations.map(mapSmsBowerActivationRecordToView)}
    />
  );
}
