import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  EmailAccountFilters,
  EmailAccountRecord,
  EmailAccountWriteInput,
} from "./schema";
import { groupEmailDomainsFromEmailNames } from "./schema";
import { getEmailAccountOrderRules } from "./sort";
import { calculateEmailAccountStats, type EmailAccountDashboardStats } from "./stats";

export type EmailAccountListResult = {
  items: EmailAccountRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getEmailAccountDashboardStats(): Promise<EmailAccountDashboardStats> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_accounts")
    .select(
      "id, email_name, source, user_name, birthday, registered_at, registered_location, is_registered_cg, cg_registered_at, is_linked_s2a, linked_at, is_expired, expired_at, deleted_at, created_at, updated_at",
    )
    .is("deleted_at", null);

  if (error) {
    throw new Error(`查询邮箱统计失败：${error.message}`);
  }

  return calculateEmailAccountStats((data ?? []) as EmailAccountRecord[]);
}

export async function listEmailAccounts(
  filters: EmailAccountFilters,
): Promise<EmailAccountListResult> {
  const supabase = createSupabaseServerClient();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.max(filters.pageSize ?? 10, 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const keyword = filters.keyword?.trim();
  const domains = filters.domains ?? [];

  let query = supabase
    .from("email_accounts")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  for (const rule of getEmailAccountOrderRules()) {
    query = query.order(rule.column, rule.options);
  }

  if (keyword) {
    query = query.or(`email_name.ilike.%${keyword}%,user_name.ilike.%${keyword}%`);
  }

  if (domains.length > 0) {
    const domainFilters = domains.map((domain) => `email_name.ilike.%@${domain}`).join(",");
    query = query.or(domainFilters);
  }

  if (typeof filters.linked === "boolean") {
    query = query.eq("is_linked_s2a", filters.linked);
  }

  if (typeof filters.expired === "boolean") {
    query = query.eq("is_expired", filters.expired);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`查询邮箱账号失败：${error.message}`);
  }

  const total = count ?? 0;

  return {
    items: (data ?? []) as EmailAccountRecord[],
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function listEmailAccountDomainOptions(): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_accounts")
    .select("email_name")
    .is("deleted_at", null);

  if (error) {
    throw new Error(`查询邮箱域名选项失败：${error.message}`);
  }

  const emailNames = (data ?? []).map((item) => item.email_name).filter(Boolean) as string[];

  return groupEmailDomainsFromEmailNames(emailNames);
}

export async function createEmailAccount(input: EmailAccountWriteInput) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("email_accounts").insert(input);

  if (error) {
    throw new Error(`新增邮箱账号失败：${error.message}`);
  }
}

export async function findActiveEmailAccountByEmailName(emailName: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_accounts")
    .select("id, email_name")
    .eq("email_name", emailName)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`查询邮箱账号失败：${error.message}`);
  }

  return data as Pick<EmailAccountRecord, "id" | "email_name"> | null;
}

export async function updateEmailAccount(id: string, input: EmailAccountWriteInput) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("email_accounts").update(input).eq("id", id);

  if (error) {
    throw new Error(`更新邮箱账号失败：${error.message}`);
  }
}

export async function softDeleteEmailAccount(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("email_accounts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`删除邮箱账号失败：${error.message}`);
  }
}
