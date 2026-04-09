"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  PRESET_EMAIL_DOMAINS,
  splitEmailName,
  type EmailAccountRecord,
  type EmailDomainOption,
} from "@/lib/email-accounts/schema";

type EmailAccountFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  record?: EmailAccountRecord | null;
  onClose: () => void;
};

type FormState = {
  email_account_name: string;
  email_domain: EmailDomainOption;
  custom_email_domain: string;
  user_name: string;
  birthday: string;
  registered_at: string;
  registered_location: string;
  is_registered_cg: boolean;
  cg_registered_at: string;
  is_linked_s2a: boolean;
  linked_at: string;
  is_expired: boolean;
  expired_at: string;
};

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

function createInitialState(record?: EmailAccountRecord | null): FormState {
  const emailNameParts = splitEmailName(record?.email_name ?? "");

  return {
    email_account_name: emailNameParts.emailAccountName,
    email_domain: emailNameParts.emailDomain,
    custom_email_domain: emailNameParts.customEmailDomain,
    user_name: record?.user_name ?? "",
    birthday: record?.birthday ?? "",
    registered_at: toDateInputValue(record?.registered_at),
    registered_location: record?.registered_location ?? "",
    is_registered_cg: record?.is_registered_cg ?? false,
    cg_registered_at: toDateInputValue(record?.cg_registered_at),
    is_linked_s2a: record?.is_linked_s2a ?? false,
    linked_at: toDateInputValue(record?.linked_at),
    is_expired: record?.is_expired ?? false,
    expired_at: toDateInputValue(record?.expired_at),
  };
}

export function EmailAccountFormDialog({
  mode,
  open,
  record,
  onClose,
}: EmailAccountFormDialogProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(createInitialState(record));
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormState(createInitialState(record));
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [open, record]);

  const title = useMemo(() => (mode === "create" ? "新增邮箱账号" : "编辑邮箱账号"), [mode]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        mode === "create" ? "/api/email-accounts" : `/api/email-accounts/${record?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formState),
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
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">账号名称</span>
                <input
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  value={formState.email_account_name}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      email_account_name: event.target.value,
                    }))
                  }
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
                      email_domain: event.target.value as EmailDomainOption,
                      custom_email_domain:
                        event.target.value === "custom" ? current.custom_email_domain : "",
                    }))
                  }
                >
                  {PRESET_EMAIL_DOMAINS.map((domain) => (
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

          <div className="grid gap-5 rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-5 md:grid-cols-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={formState.is_registered_cg}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    is_registered_cg: event.target.checked,
                    cg_registered_at: event.target.checked ? current.cg_registered_at : "",
                  }))
                }
              />
              <span>已注册 cg</span>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">cg 注册时间</span>
              <input
                type="date"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 disabled:bg-stone-100"
                value={formState.cg_registered_at}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    cg_registered_at: event.target.value,
                  }))
                }
                disabled={!formState.is_registered_cg}
                required={formState.is_registered_cg}
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={formState.is_linked_s2a}
                onChange={(event) =>
                  setFormState((current) => ({
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
                value={formState.linked_at}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, linked_at: event.target.value }))
                }
                disabled={!formState.is_linked_s2a}
                required={formState.is_linked_s2a}
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={formState.is_expired}
                onChange={(event) =>
                  setFormState((current) => ({
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
                value={formState.expired_at}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, expired_at: event.target.value }))
                }
                disabled={!formState.is_expired}
                required={formState.is_expired}
              />
            </label>
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
