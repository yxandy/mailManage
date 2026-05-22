import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  SmsBowerActivationRecord,
  SmsBowerPriceResult,
  SmsBowerPurchaseResult,
} from "./types";

export async function listActiveSmsBowerActivations(): Promise<SmsBowerActivationRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sms_bower_activations")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`查询 SMS Bower 活动列表失败：${error.message}`);
  }

  return (data ?? []) as SmsBowerActivationRecord[];
}

export async function createSmsBowerActivation(input: {
  purchase: SmsBowerPurchaseResult;
  priceItem: Pick<
    SmsBowerPriceResult,
    "serviceCode" | "countryCode" | "countryName" | "providerId" | "providerIds"
  >;
  serviceName: string;
  rawPayload?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("sms_bower_activations").upsert(
    {
      activation_id: input.purchase.activationId,
      phone_number: input.purchase.phoneNumber,
      service_code: input.priceItem.serviceCode,
      service_name: input.serviceName,
      country_id: input.priceItem.countryCode,
      country_name: input.priceItem.countryName,
      country_phone_code: input.purchase.countryPhoneCode,
      provider_id: input.priceItem.providerId || null,
      provider_ids: input.priceItem.providerIds,
      activation_cost: input.purchase.activationCost,
      activation_operator: input.purchase.activationOperator,
      can_get_another_sms: input.purchase.canGetAnotherSms,
      activation_time: input.purchase.activationTime,
      activation_status: "STATUS_WAIT_CODE",
      is_active: true,
      raw_payload: input.rawPayload ?? {},
    },
    { onConflict: "activation_id" },
  );

  if (error) {
    throw new Error(`写入 SMS Bower 活动记录失败：${error.message}`);
  }
}

export async function findSmsBowerActivationByActivationId(
  activationId: string,
): Promise<SmsBowerActivationRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sms_bower_activations")
    .select("*")
    .eq("activation_id", activationId)
    .maybeSingle();

  if (error) {
    throw new Error(`查询 SMS Bower 活动记录失败：${error.message}`);
  }

  return (data ?? null) as SmsBowerActivationRecord | null;
}

export async function getSmsBowerActivationById(
  id: string,
): Promise<SmsBowerActivationRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sms_bower_activations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`查询 SMS Bower 活动记录失败：${error.message}`);
  }

  return (data ?? null) as SmsBowerActivationRecord | null;
}

export async function updateSmsBowerActivationByActivationId(
  activationId: string,
  input: Partial<SmsBowerActivationRecord>,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("sms_bower_activations")
    .update(input)
    .eq("activation_id", activationId);

  if (error) {
    throw new Error(`更新 SMS Bower 活动记录失败：${error.message}`);
  }
}
