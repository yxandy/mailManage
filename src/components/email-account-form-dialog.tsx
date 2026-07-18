"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  splitEmailName,
  type EmailAccountRecord,
  type EmailAccountTypeCode,
} from "@/lib/email-accounts/schema";

type EmailAccountFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  record?: EmailAccountRecord | null;
  emailDomainOptions: string[];
  onClose: () => void;
};

type FormState = {
  source: string;
  email_account_name: string;
  email_domain: string;
  custom_email_domain: string;
  user_name: string;
  birthday: string;
  registered_at: string;
  registered_location: string;
  type_states: Record<EmailAccountTypeCode, TypeStateFormState>;
};

type TypeStateFormState = {
  enabled: boolean;
  is_registered: boolean;
  registered_at: string;
  is_linked_s2a: boolean;
  linked_at: string;
  is_expired: boolean;
  expired_at: string;
};

const EMAIL_TYPE_OPTIONS: Array<{ code: EmailAccountTypeCode; label: string; registeredLabel: string }> = [
  { code: "free", label: "free", registeredLabel: "已注册 CG" },
  { code: "plus", label: "plus", registeredLabel: "已注册 CG" },
  { code: "g", label: "G", registeredLabel: "已注册 G" },
];

function createEmptyTypeState(enabled = false): TypeStateFormState {
  return {
    enabled,
    is_registered: false,
    registered_at: "",
    is_linked_s2a: false,
    linked_at: "",
    is_expired: false,
    expired_at: "",
  };
}

function toDateInputValue(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function createInitialState(
  record: EmailAccountRecord | null | undefined,
  emailDomainOptions: string[],
): FormState {
  const emailNameParts = splitEmailName(record?.email_name ?? "");
  const domainOptionsLowerCase = new Set(emailDomainOptions.map((domain) => domain.toLowerCase()));
  const customDomain = emailNameParts.customEmailDomain.toLowerCase();
  const canUseExistingDomainOption =
    emailNameParts.emailDomain === "custom" &&
    customDomain &&
    domainOptionsLowerCase.has(customDomain);
  const initialEmailDomain = canUseExistingDomainOption ? customDomain : emailNameParts.emailDomain;
  const initialCustomEmailDomain = canUseExistingDomainOption ? "" : emailNameParts.customEmailDomain;
  const initialTypeStates: Record<EmailAccountTypeCode, TypeStateFormState> = {
    free: createEmptyTypeState(false),
    plus: createEmptyTypeState(false),
    g: createEmptyTypeState(false),
  };

  if (record?.type_states && record.type_states.length > 0) {
    for (const state of record.type_states) {
      initialTypeStates[state.type_code] = {
        enabled: true,
        is_registered: state.is_registered,
        registered_at: toDateInputValue(state.registered_at),
        is_linked_s2a: state.is_linked_s2a,
        linked_at: toDateInputValue(state.linked_at),
        is_expired: state.is_expired,
        expired_at: toDateInputValue(state.expired_at),
      };
    }
  } else if (record) {
    initialTypeStates[record.is_plus ? "plus" : "free"] = {
      enabled: true,
      is_registered: record.is_registered_cg,
      registered_at: toDateInputValue(record.cg_registered_at),
      is_linked_s2a: record.is_linked_s2a,
      linked_at: toDateInputValue(record.linked_at),
      is_expired: record.is_expired,
      expired_at: toDateInputValue(record.expired_at),
    };
  }

  return {
    source: record?.source ?? "manual",
    email_account_name: emailNameParts.emailAccountName,
    email_domain: initialEmailDomain,
    custom_email_domain: initialCustomEmailDomain,
    user_name: record?.user_name ?? "",
    birthday: record?.birthday ?? "",
    registered_at: toDateInputValue(record?.registered_at),
    registered_location: record?.registered_location ?? "",
    type_states: initialTypeStates,
  };
}

function splitPastedEmail(value: string): { accountName: string; domain: string } | null {
  const normalized = value.trim();
  const atIndex = normalized.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }

  const accountName = normalized.slice(0, atIndex).trim();
  const domain = normalized.slice(atIndex + 1).trim().toLowerCase();

  if (!accountName || !domain) {
    return null;
  }

  return { accountName, domain };
}

export function EmailAccountFormDialog({
  mode,
  open,
  record,
  emailDomainOptions,
  onClose,
}: EmailAccountFormDialogProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(
    createInitialState(record, emailDomainOptions),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormState(createInitialState(record, emailDomainOptions));
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [open, record, emailDomainOptions]);

  const selectableEmailDomains = useMemo(() => {
    const domainSet = new Set(emailDomainOptions);

    if (formState.email_domain !== "custom" && formState.email_domain) {
      domainSet.add(formState.email_domain);
    }

    return Array.from(domainSet).sort((a, b) => a.localeCompare(b, "en"));
  }, [emailDomainOptions, formState.email_domain]);

  const title = useMemo(() => (mode === "create" ? "新增邮箱账号" : "编辑邮箱账号"), [mode]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const selectedTypeStates = EMAIL_TYPE_OPTIONS.filter(
      (item) => formState.type_states[item.code].enabled,
    );

    if (selectedTypeStates.length === 0) {
      setErrorMessage("请至少选择一个邮箱类型");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        mode === "create" ? "/api/email-accounts" : `/api/email-accounts/${record?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formState,
            is_plus: selectedTypeStates[0].code === "plus",
            type_states: EMAIL_TYPE_OPTIONS.map((item) => ({
              type_code: item.code,
              ...formState.type_states[item.code],
            })),
          }),
        },
      );

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? `${title}失败`);
      }

      router.refresh();
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : `${title}失败`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEmailAccountNameChange(value: string) {
    const parsedEmail = splitPastedEmail(value);

    if (!parsedEmail) {
      setFormState((current) => ({
        ...current,
        email_account_name: value,
      }));
      return;
    }

    setFormState((current) => {
      const matchedDomainOption = emailDomainOptions.find(
        (domainOption) => domainOption.toLowerCase() === parsedEmail.domain,
      );

      if (matchedDomainOption) {
        return {
          ...current,
          email_account_name: parsedEmail.accountName,
          email_domain: matchedDomainOption,
          custom_email_domain: "",
        };
      }

      return {
        ...current,
        email_account_name: parsedEmail.accountName,
        email_domain: "custom",
        custom_email_domain: parsedEmail.domain,
      };
    });
  }

  function updateTypeState(
    typeCode: EmailAccountTypeCode,
    updater: (current: TypeStateFormState) => TypeStateFormState,
  ) {
    setFormState((current) => ({
      ...current,
      type_states: {
        ...current.type_states,
        [typeCode]: updater(current.type_states[typeCode]),
      },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/28 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              填写邮箱账号基础信息、关联状态与失效状态。
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-4 md:col-span-2 md:grid-cols-[1.2fr_0.8fr_1fr]">
              <div className="grid gap-2 text-sm md:col-span-3">
                <span className="text-[var(--muted)]">邮箱类型（可多选）</span>
                <div className="flex items-center gap-5">
                  {EMAIL_TYPE_OPTIONS.map((item) => (
                    <label key={item.code} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formState.type_states[item.code].enabled}
                        onChange={(event) =>
                          updateTypeState(item.code, (current) => ({
                            ...current,
                            enabled: event.target.checked,
                          }))
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">账号名称</span>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  value={formState.email_account_name}
                  onChange={(event) => handleEmailAccountNameChange(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">邮箱域名</span>
                <select
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  value={formState.email_domain}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      email_domain: event.target.value,
                      custom_email_domain:
                        event.target.value === "custom" ? current.custom_email_domain : "",
                    }))
                  }
                >
                  {selectableEmailDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                  <option value="custom">自定义</option>
                </select>
              </label>
              {formState.email_domain === "custom" ? (
                <label className="grid gap-2 text-sm">
                  <span className="text-[var(--muted)]">自定义域名</span>
                  <input
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                    value={formState.custom_email_domain}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        custom_email_domain: event.target.value,
                      }))
                    }
                    placeholder="例如 example.com"
                    required
                  />
                </label>
              ) : (
                <div className="hidden md:block" />
              )}
            </div>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">用户姓名</span>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  value={formState.user_name}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, user_name: event.target.value }))
                  }
                />
              </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">注册地点</span>
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={formState.registered_location}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    registered_location: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">用户生日</span>
              <input
                type="date"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={formState.birthday}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, birthday: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">注册时间</span>
              <input
                type="date"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={formState.registered_at}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, registered_at: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid gap-4">
            {EMAIL_TYPE_OPTIONS.filter((item) => formState.type_states[item.code].enabled).map(
              (item) => {
                const state = formState.type_states[item.code];

                return (
                  <section
                    key={item.code}
                    className="grid gap-5 rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-5 md:grid-cols-2"
                  >
                    <div className="text-sm font-semibold md:col-span-2">{item.label} 状态</div>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={state.is_registered}
                        onChange={(event) =>
                          updateTypeState(item.code, (current) => ({
                            ...current,
                            is_registered: event.target.checked,
                            registered_at: event.target.checked ? current.registered_at : "",
                          }))
                        }
                      />
                      <span>{item.registeredLabel}</span>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--muted)]">
                        {item.code === "g" ? "G 注册时间" : "CG 注册时间"}
                      </span>
                      <input
                        type="date"
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 disabled:bg-stone-100"
                        value={state.registered_at}
                        onChange={(event) =>
                          updateTypeState(item.code, (current) => ({
                            ...current,
                            registered_at: event.target.value,
                          }))
                        }
                        disabled={!state.is_registered}
                        required={state.is_registered}
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={state.is_linked_s2a}
                        onChange={(event) =>
                          updateTypeState(item.code, (current) => ({
                            ...current,
                            is_linked_s2a: event.target.checked,
                            linked_at: event.target.checked ? current.linked_at : "",
                          }))
                        }
                      />
                      <span>已关联 s2a</span>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--muted)]">关联时间</span>
                      <input
                        type="date"
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 disabled:bg-stone-100"
                        value={state.linked_at}
                        onChange={(event) =>
                          updateTypeState(item.code, (current) => ({
                            ...current,
                            linked_at: event.target.value,
                          }))
                        }
                        disabled={!state.is_linked_s2a}
                        required={state.is_linked_s2a}
                      />
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={state.is_expired}
                        onChange={(event) =>
                          updateTypeState(item.code, (current) => ({
                            ...current,
                            is_expired: event.target.checked,
                            expired_at: event.target.checked ? current.expired_at : "",
                          }))
                        }
                      />
                      <span>已失效</span>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--muted)]">失效时间</span>
                      <input
                        type="date"
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 disabled:bg-stone-100"
                        value={state.expired_at}
                        onChange={(event) =>
                          updateTypeState(item.code, (current) => ({
                            ...current,
                            expired_at: event.target.value,
                          }))
                        }
                        disabled={!state.is_expired}
                        required={state.is_expired}
                      />
                    </label>
                  </section>
                );
              },
            )}
          </div>

          {errorMessage ? (
            <p className="rounded-2xl border border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,white)] px-4 py-3 text-sm text-[var(--danger)]">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "提交中..." : mode === "create" ? "确认新增" : "确认保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
