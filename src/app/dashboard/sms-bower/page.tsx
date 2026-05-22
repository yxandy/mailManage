import { requireSession } from "@/lib/auth/auth";
import { getSmsBowerOptions } from "@/lib/sms-bower/client";

import { SmsBowerClient } from "@/components/sms-bower-client";

export default async function SmsBowerPage() {
  await requireSession();

  const options = await getSmsBowerOptions();

  return (
    <SmsBowerClient
      initialServices={options.services}
      initialCountries={options.countries}
    />
  );
}
