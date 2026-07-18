import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  EmailAccountFilters,
  EmailAccountRecord,
  EmailAccountTypeCode,
  EmailAccountTypeStateWriteInput,
  EmailAccountWriteInput,
} from "./schema";
import {
  getEmailAccountTypeCodeFromIsPlus,
  getEmailAccountTypeStateFromLegacyInput,
  groupEmailDomainsFromEmailNames,
} from "./schema";
import { getEmailAccountOrderRules } from "./sort";
import { calculateEmailAccountStats, type EmailAccountDashboardStats } from "./stats";

export type EmailAccountListResult = {
  items: EmailAccountRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type EmailAccountTypeStateRow = {
  type_code: EmailAccountTypeCode;
  is_registered: boolean;
  registered_at: string | null;
  is_linked_s2a: boolean;
  linked_at: string | null;
  is_expired: boolean;
  expired_at: string | null;
};

type EmailAccountWithTypeStates = EmailAccountRecord & {
  email_account_type_states?: EmailAccountTypeStateRow[];
};

function getFilterTypeCode(filters: Pick<EmailAccountFilters, "typeCode" | "isPlus">) {
  return filters.typeCode ?? getEmailAccountTypeCodeFromIsPlus(filters.isPlus === true);
}

function mapAccountWithTypeState(
  record: EmailAccountWithTypeStates,
  typeCode: EmailAccountTypeCode,
): EmailAccountRecord {
  const state =
    record.email_account_type_states?.find((item) => item.type_code === typeCode) ??
    record.email_account_type_states?.[0];

  if (!state) {
    return record;
  }

  return {
    ...record,
    type_states: record.email_account_type_states ?? record.type_states,
    is_plus: typeCode === "plus",
    is_registered_cg: state.is_registered,
    cg_registered_at: state.registered_at,
    is_linked_s2a: state.is_linked_s2a,
    linked_at: state.linked_at,
    is_expired: state.is_expired,
    expired_at: state.expired_at,
  };
}

async function attachEmailAccountTypeStates(
  records: EmailAccountRecord[],
): Promise<EmailAccountRecord[]> {
  const ids = records.map((record) => record.id);

  if (ids.length === 0) {
    return records;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_account_type_states")
    .select(
      "id, email_account_id, type_code, is_registered, registered_at, is_linked_s2a, linked_at, is_expired, expired_at, deleted_at, created_at, updated_at",
    )
    .in("email_account_id", ids)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`查询邮箱类型状态失败：${error.message}`);
  }

  const statesByEmailAccountId = new Map<string, EmailAccountTypeStateRow[]>();

  for (const state of (data ?? []) as Array<EmailAccountTypeStateRow & { email_account_id: string }>) {
    const currentStates = statesByEmailAccountId.get(state.email_account_id) ?? [];
    currentStates.push(state);
    statesByEmailAccountId.set(state.email_account_id, currentStates);
  }

  return records.map((record) => ({
    ...record,
    type_states: statesByEmailAccountId.get(record.id) ?? [],
  }));
}

function sortEmailAccountRecords(records: EmailAccountRecord[]): EmailAccountRecord[] {
  return [...records].sort((left, right) => {
    for (const rule of getEmailAccountOrderRules()) {
      const leftValue = left[rule.column];
      const rightValue = right[rule.column];

      if (leftValue === rightValue) {
        continue;
      }

      if (leftValue === null || leftValue === undefined) {
        return rule.options.nullsFirst ? -1 : 1;
      }

      if (rightValue === null || rightValue === undefined) {
        return rule.options.nullsFirst ? 1 : -1;
      }

      if (leftValue < rightValue) {
        return rule.options.ascending ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return rule.options.ascending ? 1 : -1;
      }
    }

    return 0;
  });
}

async function upsertEmailAccountTypeState(
  emailAccountId: string,
  state: EmailAccountTypeStateWriteInput,
) {
  const supabase = createSupabaseServerClient();
  const { data: existingState, error: findError } = await supabase
    .from("email_account_type_states")
    .select("id")
    .eq("email_account_id", emailAccountId)
    .eq("type_code", state.type_code)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (findError) {
    throw new Error(`查询邮箱类型状态失败：${findError.message}`);
  }

  const payload = {
    is_registered: state.is_registered,
    registered_at: state.registered_at,
    is_linked_s2a: state.is_linked_s2a,
    linked_at: state.linked_at,
    is_expired: state.is_expired,
    expired_at: state.expired_at,
    deleted_at: null,
  };

  const { error } = existingState
    ? await supabase.from("email_account_type_states").update(payload).eq("id", existingState.id)
    : await supabase.from("email_account_type_states").insert({
        ...payload,
        email_account_id: emailAccountId,
        type_code: state.type_code,
      });

  if (error) {
    throw new Error(`保存邮箱类型状态失败：${error.message}`);
  }
}

export async function getEmailAccountDashboardStats(
  typeCode: EmailAccountTypeCode,
): Promise<EmailAccountDashboardStats> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_accounts")
    .select(
      "id, email_name, source, user_name, is_plus, birthday, registered_at, registered_location, is_registered_cg, cg_registered_at, is_linked_s2a, linked_at, is_expired, expired_at, deleted_at, created_at, updated_at, email_account_type_states!inner(type_code, is_registered, registered_at, is_linked_s2a, linked_at, is_expired, expired_at)",
    )
    .is("deleted_at", null)
    .eq("email_account_type_states.type_code", typeCode)
    .is("email_account_type_states.deleted_at", null);

  if (error) {
    throw new Error(`查询邮箱统计失败：${error.message}`);
  }

  return calculateEmailAccountStats(
    ((data ?? []) as EmailAccountWithTypeStates[]).map((record) =>
      mapAccountWithTypeState(record, typeCode),
    ),
  );
}

export async function listEmailAccounts(
  filters: EmailAccountFilters,
): Promise<EmailAccountListResult> {
  const supabase = createSupabaseServerClient();
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.max(filters.pageSize ?? 10, 1);
  const from = (page - 1) * pageSize;
  const keyword = filters.keyword?.trim();
  const domains = filters.domains ?? [];
  const typeCode = getFilterTypeCode(filters);

  let query = supabase
    .from("email_accounts")
    .select(
      "id, email_name, source, user_name, is_plus, birthday, registered_at, registered_location, is_registered_cg, cg_registered_at, is_linked_s2a, linked_at, is_expired, expired_at, deleted_at, created_at, updated_at, email_account_type_states!inner(type_code, is_registered, registered_at, is_linked_s2a, linked_at, is_expired, expired_at)",
    )
    .is("deleted_at", null)
    .eq("email_account_type_states.type_code", typeCode)
    .is("email_account_type_states.deleted_at", null);

  if (keyword) {
    query = query.or(`email_name.ilike.%${keyword}%,user_name.ilike.%${keyword}%`);
  }

  if (domains.length > 0) {
    const domainFilters = domains.map((domain) => `email_name.ilike.%@${domain}`).join(",");
    query = query.or(domainFilters);
  }

  const { data, error } = await query.limit(5000);

  if (error) {
    throw new Error(`查询邮箱账号失败：${error.message}`);
  }

  let items = ((data ?? []) as EmailAccountWithTypeStates[]).map((record) =>
    mapAccountWithTypeState(record, typeCode),
  );

  if (typeof filters.linked === "boolean") {
    items = items.filter((item) => item.is_linked_s2a === filters.linked);
  }

  if (typeof filters.expired === "boolean") {
    items = items.filter((item) => item.is_expired === filters.expired);
  }

  items = sortEmailAccountRecords(items);
  const total = items.length;

  return {
    items: await attachEmailAccountTypeStates(items.slice(from, from + pageSize)),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function listEmailAccountDomainOptions(typeCode: EmailAccountTypeCode): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_accounts")
    .select("email_name, email_account_type_states!inner(type_code)")
    .is("deleted_at", null)
    .eq("email_account_type_states.type_code", typeCode)
    .is("email_account_type_states.deleted_at", null);

  if (error) {
    throw new Error(`查询邮箱域名选项失败：${error.message}`);
  }

  const emailNames = (data ?? []).map((item) => item.email_name).filter(Boolean) as string[];

  return groupEmailDomainsFromEmailNames(emailNames);
}

export async function createEmailAccount(
  input: EmailAccountWriteInput,
  typeStates: EmailAccountTypeStateWriteInput[] = [getEmailAccountTypeStateFromLegacyInput(input)],
) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("email_accounts").insert(input).select("id").single();

  if (error) {
    throw new Error(`新增邮箱账号失败：${error.message}`);
  }

  for (const state of typeStates) {
    await upsertEmailAccountTypeState(data.id as string, state);
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

export async function updateEmailAccount(
  id: string,
  input: EmailAccountWriteInput,
  typeStates: EmailAccountTypeStateWriteInput[] = [getEmailAccountTypeStateFromLegacyInput(input)],
) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("email_accounts").update(input).eq("id", id);

  if (error) {
    throw new Error(`更新邮箱账号失败：${error.message}`);
  }

  const selectedTypeCodes = typeStates.map((state) => state.type_code);

  for (const state of typeStates) {
    await upsertEmailAccountTypeState(id, state);
  }

  const { error: deleteStateError } = await supabase
    .from("email_account_type_states")
    .update({ deleted_at: new Date().toISOString() })
    .eq("email_account_id", id)
    .not("type_code", "in", `(${selectedTypeCodes.join(",")})`)
    .is("deleted_at", null);

  if (deleteStateError) {
    throw new Error(`清理邮箱类型状态失败：${deleteStateError.message}`);
  }
}

export async function softDeleteEmailAccount(id: string) {
  const supabase = createSupabaseServerClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("email_accounts")
    .update({ deleted_at: deletedAt })
    .eq("id", id);

  if (error) {
    throw new Error(`删除邮箱账号失败：${error.message}`);
  }

  const { error: stateError } = await supabase
    .from("email_account_type_states")
    .update({ deleted_at: deletedAt })
    .eq("email_account_id", id)
    .is("deleted_at", null);

  if (stateError) {
    throw new Error(`删除邮箱类型状态失败：${stateError.message}`);
  }
}
