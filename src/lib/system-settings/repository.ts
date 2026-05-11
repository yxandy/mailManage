import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_CNY_PRICE = 34.34;

function normalizeCnyPrice(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    throw new Error("人民币数值格式不正确");
  }

  if (numeric < 0) {
    throw new Error("人民币数值不能小于 0");
  }

  return Math.round(numeric * 100) / 100;
}

export async function getCnyPrice(): Promise<number> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("cny_price")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(`查询人民币数值失败：${error.message}`);
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("system_settings")
      .insert({ id: 1, cny_price: DEFAULT_CNY_PRICE });

    if (insertError) {
      throw new Error(`初始化人民币数值失败：${insertError.message}`);
    }

    return DEFAULT_CNY_PRICE;
  }

  return normalizeCnyPrice(data.cny_price);
}

export async function updateCnyPrice(value: number): Promise<number> {
  const cnyPrice = normalizeCnyPrice(value);
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("system_settings")
    .upsert({ id: 1, cny_price: cnyPrice }, { onConflict: "id" });

  if (error) {
    throw new Error(`更新人民币数值失败：${error.message}`);
  }

  return cnyPrice;
}
