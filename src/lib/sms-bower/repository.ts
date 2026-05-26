import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  SmsBowerActivationRecord,
  SmsBowerCountryFavoriteRecord,
  SmsBowerFavoriteRecord,
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
  const row = {
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
  };
  const { error } = await supabase
    .from("sms_bower_activations")
    .upsert(row, { onConflict: "activation_id" });

  if (error?.message.includes("country_phone_code")) {
    const fallbackRow: Omit<typeof row, "country_phone_code"> = {
      activation_id: row.activation_id,
      phone_number: row.phone_number,
      service_code: row.service_code,
      service_name: row.service_name,
      country_id: row.country_id,
      country_name: row.country_name,
      provider_id: row.provider_id,
      provider_ids: row.provider_ids,
      activation_cost: row.activation_cost,
      activation_operator: row.activation_operator,
      can_get_another_sms: row.can_get_another_sms,
      activation_time: row.activation_time,
      activation_status: row.activation_status,
      is_active: row.is_active,
      raw_payload: row.raw_payload,
    };
    const { error: fallbackError } = await supabase
      .from("sms_bower_activations")
      .upsert(fallbackRow, { onConflict: "activation_id" });

    if (fallbackError) {
      throw new Error(`写入 SMS Bower 活动记录失败：${fallbackError.message}`);
    }

    return;
  }

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

export async function listSmsBowerFavorites(): Promise<SmsBowerFavoriteRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sms_bower_favorites")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`查询 SMS Bower 收藏失败：${error.message}`);
  }

  return (data ?? []) as SmsBowerFavoriteRecord[];
}

export async function createSmsBowerFavorite(input: {
  serviceId: number;
  serviceCode: string;
  serviceName: string;
  minPrice: string;
  maxPrice: string;
  rankIds: number[];
  earlyRetryMinutes: number;
  earlyRetryIntervalSeconds: number;
  laterRetryIntervalSeconds: number;
  maxWaitMinutes: number;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const row = {
    service_id: input.serviceId,
    service_code: input.serviceCode,
    service_name: input.serviceName,
    min_price: input.minPrice,
    max_price: input.maxPrice,
    rank_ids: input.rankIds,
    early_retry_minutes: input.earlyRetryMinutes,
    early_retry_interval_seconds: input.earlyRetryIntervalSeconds,
    later_retry_interval_seconds: input.laterRetryIntervalSeconds,
    max_wait_minutes: input.maxWaitMinutes,
  };
  const { data: existingData, error: existingError } = await supabase
    .from("sms_bower_favorites")
    .select("id, rank_ids")
    .match({
      service_id: row.service_id,
      service_code: row.service_code,
      service_name: row.service_name,
      min_price: row.min_price,
      max_price: row.max_price,
      early_retry_minutes: row.early_retry_minutes,
      early_retry_interval_seconds: row.early_retry_interval_seconds,
      later_retry_interval_seconds: row.later_retry_interval_seconds,
      max_wait_minutes: row.max_wait_minutes,
    })
    .is("deleted_at", null)
    .limit(20);

  if (existingError) {
    throw new Error(`查询 SMS Bower 收藏失败：${existingError.message}`);
  }

  if (
    (existingData ?? []).some((item) => {
      const existingRankIds = Array.isArray(item.rank_ids) ? item.rank_ids : [];

      return (
        existingRankIds.length === row.rank_ids.length &&
        existingRankIds.every((rankId, index) => rankId === row.rank_ids[index])
      );
    })
  ) {
    return;
  }

  const { error } = await supabase.from("sms_bower_favorites").insert(row);

  if (error) {
    throw new Error(`写入 SMS Bower 收藏失败：${error.message}`);
  }
}

export async function softDeleteSmsBowerFavorite(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("sms_bower_favorites")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`删除 SMS Bower 收藏失败：${error.message}`);
  }
}

export async function listSmsBowerCountryFavorites(): Promise<SmsBowerCountryFavoriteRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("sms_bower_country_favorites")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`查询 SMS Bower 国家收藏失败：${error.message}`);
  }

  return (data ?? []) as SmsBowerCountryFavoriteRecord[];
}

export async function createSmsBowerCountryFavorite(input: {
  countryId: number;
  countryName: string;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { data: existingData, error: existingError } = await supabase
    .from("sms_bower_country_favorites")
    .select("id")
    .eq("country_id", input.countryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw new Error(`查询 SMS Bower 国家收藏失败：${existingError.message}`);
  }

  if (existingData) {
    return;
  }

  const { error } = await supabase.from("sms_bower_country_favorites").insert({
    country_id: input.countryId,
    country_name: input.countryName,
  });

  if (error) {
    throw new Error(`写入 SMS Bower 国家收藏失败：${error.message}`);
  }
}

export async function softDeleteSmsBowerCountryFavorite(countryId: number): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("sms_bower_country_favorites")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("country_id", countryId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`删除 SMS Bower 国家收藏失败：${error.message}`);
  }
}
