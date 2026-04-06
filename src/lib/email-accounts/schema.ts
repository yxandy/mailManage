export type EmailAccountFormInput = {
  email_name: string;
  user_name: string;
  birthday?: string | null;
  registered_at: string;
  registered_location: string;
  is_linked_s2a: boolean | string;
  linked_at?: string | null;
  is_expired: boolean | string;
  expired_at?: string | null;
};

export type EmailAccountWriteInput = {
  email_name: string;
  user_name: string;
  birthday: string | null;
  registered_at: string;
  registered_location: string;
  is_linked_s2a: boolean;
  linked_at: string | null;
  is_expired: boolean;
  expired_at: string | null;
};

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

function normalizeDateTime(value: string, fieldName: string): string {
  const normalized = normalizeText(value);

  if (!normalized) {
    throw new Error(`${fieldName}不能为空`);
  }

  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${fieldName}格式不正确`);
  }

  return parsedDate.toISOString();
}

export function normalizeEmailAccountInput(
  input: EmailAccountFormInput,
): EmailAccountWriteInput {
  const emailName = normalizeText(input.email_name);
  const userName = normalizeText(input.user_name);
  const registeredLocation = normalizeText(input.registered_location);

  if (!emailName) {
    throw new Error("邮箱账号名称不能为空");
  }

  if (!userName) {
    throw new Error("用户姓名不能为空");
  }

  if (!registeredLocation) {
    throw new Error("注册地点不能为空");
  }

  const isLinkedS2A = toBoolean(input.is_linked_s2a);
  const isExpired = toBoolean(input.is_expired);

  return {
    email_name: emailName,
    user_name: userName,
    birthday: normalizeOptionalDate(input.birthday),
    registered_at: normalizeDateTime(input.registered_at, "注册时间"),
    registered_location: registeredLocation,
    is_linked_s2a: isLinkedS2A,
    linked_at: isLinkedS2A
      ? normalizeDateTime(normalizeText(input.linked_at), "关联时间")
      : null,
    is_expired: isExpired,
    expired_at: isExpired
      ? normalizeDateTime(normalizeText(input.expired_at), "失效时间")
      : null,
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
