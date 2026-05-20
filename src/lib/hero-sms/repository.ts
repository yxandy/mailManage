import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  HeroSmsActivationHistoryRecord,
  HeroSmsActivationRecord,
  HeroSmsCostSummaryView,
  HeroSmsFavoriteRecord,
  HeroSmsPriceMonitorRecord,
  HeroSmsPriceMonitorStatus,
  HeroSmsPurchaseResultView,
} from "./types";
import type { HeroSmsActivationHistoryInput } from "./history";

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
      activation_status: "4",
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

export async function findHeroSmsActivationByActivationId(
  activationId: string,
): Promise<HeroSmsActivationRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_activations")
    .select("*")
    .eq("activation_id", activationId)
    .maybeSingle();

  if (error) {
    throw new Error(`查询 HeroSMS 活动记录失败：${error.message}`);
  }

  return (data ?? null) as HeroSmsActivationRecord | null;
}

export async function getHeroSmsActivationById(id: string): Promise<HeroSmsActivationRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_activations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`查询 HeroSMS 活动记录失败：${error.message}`);
  }

  return (data ?? null) as HeroSmsActivationRecord | null;
}

export async function listHeroSmsFavorites(): Promise<HeroSmsFavoriteRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_favorites")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`查询 HeroSMS 收藏失败：${error.message}`);
  }

  return (data ?? []) as HeroSmsFavoriteRecord[];
}

export async function createHeroSmsFavorite(input: {
  serviceCode: string;
  serviceName: string;
  countryId: number;
  countryName: string;
  operatorCode: string;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("hero_sms_favorites").upsert(
    {
      service_code: input.serviceCode,
      service_name: input.serviceName,
      country_id: input.countryId,
      country_name: input.countryName,
      operator_code: input.operatorCode || null,
    },
    { onConflict: "service_code,country_id,operator_code" },
  );

  if (error) {
    throw new Error(`写入 HeroSMS 收藏失败：${error.message}`);
  }
}

export async function softDeleteHeroSmsFavorite(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("hero_sms_favorites")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`删除 HeroSMS 收藏失败：${error.message}`);
  }
}

export async function upsertHeroSmsActivationHistory(
  items: HeroSmsActivationHistoryInput[],
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("hero_sms_activation_history").upsert(
    items.map((item) => ({
      activation_id: item.activationId,
      activation_date: item.activationDate,
      phone_number: item.phoneNumber,
      activation_cost: item.activationCost,
      currency_code: item.currencyCode,
      service_code: item.serviceCode,
      service_name: item.serviceName,
      country_id: item.countryId,
      country_name: item.countryName,
      operator_code: item.operatorCode,
      activation_status: item.activationStatus,
      sms_text: item.smsText,
      raw_payload: item.rawPayload,
      synced_at: new Date().toISOString(),
    })),
    { onConflict: "activation_id" },
  );

  if (error) {
    throw new Error(`写入 HeroSMS 历史记录失败：${error.message}`);
  }
}

export async function listHeroSmsActivationHistory(): Promise<HeroSmsActivationHistoryRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_activation_history")
    .select("*")
    .order("activation_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`查询 HeroSMS 历史记录失败：${error.message}`);
  }

  return (data ?? []) as HeroSmsActivationHistoryRecord[];
}

export async function getHeroSmsCostSummary(): Promise<HeroSmsCostSummaryView> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_activation_history")
    .select("activation_cost");

  if (error) {
    throw new Error(`查询 HeroSMS 成本汇总失败：${error.message}`);
  }

  const totalCost = (data ?? []).reduce(
    (sum, item: { activation_cost: string | number | null }) =>
      sum + Number(item.activation_cost ?? 0),
    0,
  );

  return {
    totalCost: totalCost.toFixed(4),
  };
}

export async function listHeroSmsPriceMonitors(): Promise<HeroSmsPriceMonitorRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_price_monitors")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`查询 HeroSMS 价格监控失败：${error.message}`);
  }

  return (data ?? []) as HeroSmsPriceMonitorRecord[];
}

export async function listActiveHeroSmsPriceMonitors(): Promise<HeroSmsPriceMonitorRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("hero_sms_price_monitors")
    .select("*")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("last_checked_at", { ascending: true, nullsFirst: true });

  if (error) {
    throw new Error(`查询待检查 HeroSMS 价格监控失败：${error.message}`);
  }

  return (data ?? []) as HeroSmsPriceMonitorRecord[];
}

export async function createHeroSmsPriceMonitor(input: {
  serviceCode: string;
  serviceName: string;
  countryId: number;
  countryName: string;
  operatorCode: string;
  operatorName: string;
  targetPrice: string;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("hero_sms_price_monitors").insert({
    service_code: input.serviceCode,
    service_name: input.serviceName,
    country_id: input.countryId,
    country_name: input.countryName,
    operator_code: input.operatorCode || "any",
    operator_name: input.operatorName,
    target_price: input.targetPrice,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("这个服务、国家、运营商和价格已经在监控中");
    }

    throw new Error(`创建 HeroSMS 价格监控失败：${error.message}`);
  }
}

export async function updateHeroSmsPriceMonitorStatus(
  id: string,
  status: Exclude<HeroSmsPriceMonitorStatus, "deleted">,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const updates: Partial<HeroSmsPriceMonitorRecord> = { status };

  if (status === "active") {
    updates.triggered_at = null;
    updates.last_error = null;
  }

  const { error } = await supabase
    .from("hero_sms_price_monitors")
    .update(updates)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`更新 HeroSMS 价格监控状态失败：${error.message}`);
  }
}

export async function softDeleteHeroSmsPriceMonitor(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("hero_sms_price_monitors")
    .update({
      status: "deleted",
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`删除 HeroSMS 价格监控失败：${error.message}`);
  }
}

export async function markHeroSmsPriceMonitorChecked(input: {
  id: string;
  checkedAt: string;
  availableCount: number;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("hero_sms_price_monitors")
    .update({
      last_checked_at: input.checkedAt,
      last_available_count: input.availableCount,
      last_error: null,
    })
    .eq("id", input.id)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    throw new Error(`更新 HeroSMS 价格监控检查结果失败：${error.message}`);
  }
}

export async function markHeroSmsPriceMonitorTriggered(input: {
  id: string;
  checkedAt: string;
  availableCount: number;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("hero_sms_price_monitors")
    .update({
      status: "triggered",
      last_checked_at: input.checkedAt,
      last_available_count: input.availableCount,
      triggered_at: input.checkedAt,
      last_error: null,
    })
    .eq("id", input.id)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    throw new Error(`标记 HeroSMS 价格监控已触发失败：${error.message}`);
  }
}

export async function markHeroSmsPriceMonitorCheckFailed(input: {
  id: string;
  checkedAt: string;
  errorMessage: string;
}): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("hero_sms_price_monitors")
    .update({
      last_checked_at: input.checkedAt,
      last_error: input.errorMessage,
    })
    .eq("id", input.id)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    throw new Error(`记录 HeroSMS 价格监控失败状态失败：${error.message}`);
  }
}
