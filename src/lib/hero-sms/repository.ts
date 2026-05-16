import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { HeroSmsActivationRecord, HeroSmsPurchaseResultView } from "./types";

export async function listActiveHeroSmsActivations(): Promise<HeroSmsActivationRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_activations")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`查询 HeroSMS 活动列表失败：${error.message}`);
  }

  return (data ?? []) as HeroSmsActivationRecord[];
}

export async function createHeroSmsActivation(input: {
  purchase: HeroSmsPurchaseResultView;
  serviceCode: string;
  serviceName: string;
  countryId: number;
  countryName: string;
  operatorCode: string;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("hero_sms_activations").upsert(
    {
      activation_id: input.purchase.activationId,
      phone_number: input.purchase.phoneNumber,
      service_code: input.serviceCode,
      service_name: input.serviceName,
      country_id: input.countryId,
      country_name: input.countryName,
      country_phone_code: input.purchase.countryPhoneCode,
      operator_code: input.operatorCode || input.purchase.activationOperator,
      activation_cost: input.purchase.activationCost,
      currency_code: input.purchase.currency,
      can_get_another_sms: input.purchase.canGetAnotherSms,
      activation_time: input.purchase.activationTime,
      activation_end_time: input.purchase.activationEndTime,
      activation_status: "1",
      is_active: true,
    },
    { onConflict: "activation_id" },
  );

  if (error) {
    throw new Error(`写入 HeroSMS 活动记录失败：${error.message}`);
  }
}

export async function updateHeroSmsActivationByActivationId(
  activationId: string,
  input: Partial<HeroSmsActivationRecord>,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("hero_sms_activations")
    .update(input)
    .eq("activation_id", activationId);

  if (error) {
    throw new Error(`更新 HeroSMS 活动记录失败：${error.message}`);
  }
}
