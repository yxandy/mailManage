import { requireSession } from "@/lib/auth/auth";
import { getHeroSmsBalance, getHeroSmsOptions } from "@/lib/hero-sms/client";

import { HeroSmsReadonlyClient } from "@/components/hero-sms-readonly-client";

export default async function HeroSmsPage() {
  await requireSession();

  const [balance, options] = await Promise.all([getHeroSmsBalance(), getHeroSmsOptions()]);

  return (
    <HeroSmsReadonlyClient
      initialBalance={balance}
      initialServices={options.services}
      initialCountries={options.countries}
    />
  );
}
