export type EmailAccountFormInput = {
  email_name?: string;
  email_account_name?: string;
  email_domain?: string;
  custom_email_domain?: string;
  user_name: string;
  birthday?: string | null;
  registered_at: string;
  registered_location: string;
  is_registered_cg?: boolean | string;
  cg_registered_at?: string | null;
  is_linked_s2a: boolean | string;
  linked_at?: string | null;
  is_expired: boolean | string;
  expired_at?: string | null;
};

export type EmailAccountWriteInput = {
  email_name: string;
  user_name: string | null;
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

export const PRESET_EMAIL_DOMAINS = [
  "hotmail.com",
  "outlook.com",
  "gmail.com",
  "qq.com",
  "126.com",
] as const;

export type EmailDomainOption = (typeof PRESET_EMAIL_DOMAINS)[number] | "custom";

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

  return {
    email_name: emailName,
    user_name: normalizeOptionalText(input.user_name),
    birthday: normalizeOptionalDate(input.birthday),
    registered_at: normalizeOptionalDateTime(input.registered_at),
    registered_location: normalizeOptionalText(input.registered_location),
    is_registered_cg: isRegisteredCg,
    cg_registered_at: isRegisteredCg ? normalizeOptionalDateTime(input.cg_registered_at) : null,
    is_linked_s2a: isLinkedS2A,
    linked_at: isLinkedS2A ? normalizeOptionalDateTime(input.linked_at) : null,
    is_expired: isExpired,
    expired_at: isExpired ? normalizeOptionalDateTime(input.expired_at) : null,
  };
}

export type EmailAccountRecord = EmailAccountWriteInput & {
  id: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailAccountFilters = {
  keyword?: string;
  linked?: boolean | null;
  expired?: boolean | null;
  page?: number;
  pageSize?: number;
};
