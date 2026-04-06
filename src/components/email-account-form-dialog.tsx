"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { EmailAccountRecord } from "@/lib/email-accounts/schema";

type EmailAccountFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  record?: EmailAccountRecord | null;
  onClose: () => void;
};

type FormState = {
  email_name: string;
  user_name: string;
  birthday: string;
  registered_at: string;
  registered_location: string;
  is_linked_s2a: boolean;
  linked_at: string;
  is_expired: boolean;
  expired_at: string;
};

function toDatetimeLocalValue(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function createInitialState(record?: EmailAccountRecord | null): FormState {
  return {
    email_name: record?.email_name ?? "",
    user_name: record?.user_name ?? "",
    birthday: record?.birthday ?? "",
    registered_at: toDatetimeLocalValue(record?.registered_at),
    registered_location: record?.registered_location ?? "",
    is_linked_s2a: record?.is_linked_s2a ?? false,
    linked_at: toDatetimeLocalValue(record?.linked_at),
    is_expired: record?.is_expired ?? false,
    expired_at: toDatetimeLocalValue(record?.expired_at),
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
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">邮箱账号名称</span>
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={formState.email_name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, email_name: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">用户姓名</span>
              <input
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={formState.user_name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, user_name: event.target.value }))
                }
                required
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
                type="datetime-local"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={formState.registered_at}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, registered_at: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
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
                required
              />
            </label>
          </div>

          <div className="grid gap-5 rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-5 md:grid-cols-2">
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
                type="datetime-local"
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
                type="datetime-local"
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
