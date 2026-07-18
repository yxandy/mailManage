export type EmailAccountFormInput = {
  source?: string | null;
  email_name?: string;
  email_account_name?: string;
  email_domain?: string;
  custom_email_domain?: string;
  user_name: string;
  is_plus?: boolean | string;
  birthday?: string | null;
  registered_at: string;
  registered_location: string;
  is_registered_cg?: boolean | string;
  cg_registered_at?: string | null;
  is_linked_s2a: boolean | string;
  linked_at?: string | null;
  is_expired: boolean | string;
  expired_at?: string | null;
  type_states?: Array<{
    type_code?: string;
    enabled?: boolean | string;
    is_registered?: boolean | string;
    registered_at?: string | null;
    is_linked_s2a?: boolean | string;
    linked_at?: string | null;
    is_expired?: boolean | string;
    expired_at?: string | null;
  }>;
};

export type EmailAccountWriteInput = {
  email_name: string;
  source: string | null;
  user_name: string | null;
  is_plus: boolean;
  birthday: string | null;
  registered_at: string | null;
  registered_location: string | null;
  is_registered_cg: boolean;
  cg_registered_at: string | null;
  is_linked_s2a: boolean;
  linked_at: string | null;
  is_expired: boolean;
  expired_at: string | null;
};

export type EmailAccountTypeCode = "free" | "plus" | "g";

export const EMAIL_ACCOUNT_TYPE_CODES = ["free", "plus", "g"] as const;

export type EmailAccountTypeStateWriteInput = {
  type_code: EmailAccountTypeCode;
  is_registered: boolean;
  registered_at: string | null;
  is_linked_s2a: boolean;
  linked_at: string | null;
  is_expired: boolean;
  expired_at: string | null;
};

export type EmailAccountTypeStateRecord = EmailAccountTypeStateWriteInput & {
  id?: string;
  email_account_id?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type NormalizedEmailAccountInput = {
  account: EmailAccountWriteInput;
  typeStates: EmailAccountTypeStateWriteInput[];
};

export const PRESET_EMAIL_DOMAINS = [
  "hotmail.com",
  "outlook.com",
  "gmail.com",
  "qq.com",
  "126.com",
  "proton.me",
] as const;

export type EmailDomainOption = (typeof PRESET_EMAIL_DOMAINS)[number] | "custom";

function extractEmailDomain(emailName: string): string | null {
  const normalized = normalizeText(emailName).toLowerCase();

  if (!normalized) {
    return null;
  }

  const atIndex = normalized.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }

  return normalized.slice(atIndex + 1);
}

export function groupEmailDomainsFromEmailNames(emailNames: string[]): string[] {
  const uniqueDomains = new Set<string>();

  for (const emailName of emailNames) {
    const domain = extractEmailDomain(emailName);

    if (domain) {
      uniqueDomains.add(domain);
    }
  }

  return Array.from(uniqueDomains).sort((a, b) => a.localeCompare(b, "en"));
}

export function normalizeDomainFilters(domains: string[]): string[] {
  const uniqueDomains = new Set<string>();

  for (const domain of domains) {
    const normalizedDomain = normalizeText(domain).toLowerCase();

    if (normalizedDomain) {
      uniqueDomains.add(normalizedDomain);
    }
  }

  return Array.from(uniqueDomains);
}

function toBoolean(value: boolean | string): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  return value === "true" || value === "on";
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function normalizeOptionalDate(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);

  return normalized ? normalized : null;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);

  return normalized ? normalized : null;
}

function normalizeOptionalDateTime(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("时间格式不正确");
  }

  return parsedDate.toISOString();
}

function normalizeEmailAccountTypeCode(value: string | null | undefined): EmailAccountTypeCode {
  const normalized = normalizeText(value).toLowerCase();

  if ((EMAIL_ACCOUNT_TYPE_CODES as readonly string[]).includes(normalized)) {
    return normalized as EmailAccountTypeCode;
  }

  throw new Error("邮箱类型不正确");
}

function normalizeDateOnlyWithCurrentUtcHourMinute(value: string): string | null {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!matched) {
    return null;
  }

  const year = Number(matched[1]);
  const monthIndex = Number(matched[2]) - 1;
  const day = Number(matched[3]);
  const now = new Date();
  const composedDate = new Date(
    Date.UTC(year, monthIndex, day, now.getUTCHours(), now.getUTCMinutes(), 0, 0),
  );

  if (Number.isNaN(composedDate.getTime())) {
    throw new Error("时间格式不正确");
  }

  return composedDate.toISOString();
}

function normalizeRegisteredAtDateTime(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const normalizedDateOnly = normalizeDateOnlyWithCurrentUtcHourMinute(normalized);

  if (normalizedDateOnly) {
    return normalizedDateOnly;
  }

  return normalizeOptionalDateTime(normalized);
}

function normalizeEmailName(
  emailAccountNameValue: string | null | undefined,
  emailDomainValue: string | null | undefined,
  customEmailDomainValue: string | null | undefined,
  fallbackEmailNameValue: string | null | undefined,
): string {
  const fallbackEmailName = normalizeText(fallbackEmailNameValue);

  if (
    emailAccountNameValue === undefined &&
    emailDomainValue === undefined &&
    customEmailDomainValue === undefined
  ) {
    if (!fallbackEmailName) {
      throw new Error("邮箱账号名称不能为空");
    }

    return fallbackEmailName;
  }

  const emailAccountName = normalizeText(emailAccountNameValue);
  const emailDomain = normalizeText(emailDomainValue);
  const customEmailDomain = normalizeText(customEmailDomainValue);

  if (!emailAccountName) {
    throw new Error("账号名称不能为空");
  }

  if (!emailDomain) {
    throw new Error("邮箱域名不能为空");
  }

  const finalDomain = emailDomain === "custom" ? customEmailDomain : emailDomain;

  if (!finalDomain) {
    throw new Error("自定义邮箱域名不能为空");
  }

  return `${emailAccountName}@${finalDomain}`;
}

export function splitEmailName(emailName: string): {
  emailAccountName: string;
  emailDomain: EmailDomainOption;
  customEmailDomain: string;
} {
  const normalized = normalizeText(emailName);
  const [localPart = normalized, domain = ""] = normalized.split("@");

  if (!domain) {
    return {
      emailAccountName: normalized,
      emailDomain: "custom",
      customEmailDomain: "",
    };
  }

  if (PRESET_EMAIL_DOMAINS.includes(domain as (typeof PRESET_EMAIL_DOMAINS)[number])) {
    return {
      emailAccountName: localPart,
      emailDomain: domain as EmailDomainOption,
      customEmailDomain: "",
    };
  }

  return {
    emailAccountName: localPart,
    emailDomain: "custom",
    customEmailDomain: domain,
  };
}

export function normalizeEmailAccountInput(
  input: EmailAccountFormInput,
): EmailAccountWriteInput {
  const emailName = normalizeEmailName(
    input.email_account_name,
    input.email_domain,
    input.custom_email_domain,
    input.email_name,
  );
  const isLinkedS2A = toBoolean(input.is_linked_s2a);
  const isRegisteredCg = toBoolean(input.is_registered_cg ?? false);
  const isExpired = toBoolean(input.is_expired);
  const isPlus = toBoolean(input.is_plus ?? false);

  return {
    email_name: emailName,
    source: normalizeOptionalText(input.source) ?? "manual",
    user_name: normalizeOptionalText(input.user_name),
    is_plus: isPlus,
    birthday: normalizeOptionalDate(input.birthday),
    registered_at: normalizeRegisteredAtDateTime(input.registered_at),
    registered_location: normalizeOptionalText(input.registered_location),
    is_registered_cg: isRegisteredCg,
    cg_registered_at: isRegisteredCg ? normalizeOptionalDateTime(input.cg_registered_at) : null,
    is_linked_s2a: isLinkedS2A,
    linked_at: isLinkedS2A ? normalizeOptionalDateTime(input.linked_at) : null,
    is_expired: isExpired,
    expired_at: isExpired ? normalizeOptionalDateTime(input.expired_at) : null,
  };
}

export function normalizeEmailAccountWithTypeStatesInput(
  input: EmailAccountFormInput,
): NormalizedEmailAccountInput {
  const account = normalizeEmailAccountInput(input);
  const legacyState = getEmailAccountTypeStateFromLegacyInput(account);
  const rawTypeStates = input.type_states ?? [];

  if (rawTypeStates.length === 0) {
    return {
      account,
      typeStates: [legacyState],
    };
  }

  const typeStates = rawTypeStates
    .filter((item) => toBoolean(item.enabled ?? false))
    .map((item) => {
      const typeCode = normalizeEmailAccountTypeCode(item.type_code);
      const isRegistered = toBoolean(item.is_registered ?? false);
      const isLinkedS2A = toBoolean(item.is_linked_s2a ?? false);
      const isExpired = toBoolean(item.is_expired ?? false);

      return {
        type_code: typeCode,
        is_registered: isRegistered,
        registered_at: isRegistered ? normalizeOptionalDateTime(item.registered_at) : null,
        is_linked_s2a: isLinkedS2A,
        linked_at: isLinkedS2A ? normalizeOptionalDateTime(item.linked_at) : null,
        is_expired: isExpired,
        expired_at: isExpired ? normalizeOptionalDateTime(item.expired_at) : null,
      };
    });

  if (typeStates.length === 0) {
    throw new Error("请至少选择一个邮箱类型");
  }

  const primaryState =
    typeStates.find((state) => state.type_code === legacyState.type_code) ?? typeStates[0];

  return {
    account: {
      ...account,
      is_plus: primaryState.type_code === "plus",
      is_registered_cg: primaryState.is_registered,
      cg_registered_at: primaryState.registered_at,
      is_linked_s2a: primaryState.is_linked_s2a,
      linked_at: primaryState.linked_at,
      is_expired: primaryState.is_expired,
      expired_at: primaryState.expired_at,
    },
    typeStates,
  };
}

export type EmailAccountRecord = EmailAccountWriteInput & {
  id: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  type_states?: EmailAccountTypeStateRecord[];
};

export type EmailAccountFilters = {
  keyword?: string;
  domains?: string[];
  typeCode?: EmailAccountTypeCode;
  isPlus?: boolean;
  linked?: boolean | null;
  expired?: boolean | null;
  page?: number;
  pageSize?: number;
};

export function getEmailAccountTypeCodeFromIsPlus(isPlus: boolean): EmailAccountTypeCode {
  return isPlus ? "plus" : "free";
}

export function getEmailAccountTypeStateFromLegacyInput(
  input: EmailAccountWriteInput,
): EmailAccountTypeStateWriteInput {
  return {
    type_code: getEmailAccountTypeCodeFromIsPlus(input.is_plus),
    is_registered: input.is_registered_cg,
    registered_at: input.cg_registered_at,
    is_linked_s2a: input.is_linked_s2a,
    linked_at: input.linked_at,
    is_expired: input.is_expired,
    expired_at: input.expired_at,
  };
}
