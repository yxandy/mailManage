"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { EmailAccountRecord } from "@/lib/email-accounts/schema";
import type { EmailAccountDashboardStats } from "@/lib/email-accounts/stats";
import { getEmailNameColorClass } from "@/lib/email-accounts/status";

import { EmailAccountFormDialog } from "./email-account-form-dialog";
import { Pagination } from "./pagination";

type DashboardClientProps = {
  username: string;
  items: EmailAccountRecord[];
  stats: EmailAccountDashboardStats;
  emailDomainOptions: string[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | undefined>;
};

function formatDate(value?: string | null, includeTime = false) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: includeTime ? "2-digit" : undefined,
    minute: includeTime ? "2-digit" : undefined,
    hour12: false,
  }).format(date);
}

function formatDateOnly(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function DashboardClient({
  username,
  items,
  stats,
  emailDomainOptions,
  currentPage,
  pageSize,
  totalPages,
  total,
  searchParams,
}: DashboardClientProps) {
  const router = useRouter();
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingRecord, setEditingRecord] = useState<EmailAccountRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("确认删除这条邮箱账号记录吗？该操作会执行软删除。");

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/email-accounts/${id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "删除失败");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
                  管理后台
                </p>
                <h1 className="text-3xl font-semibold">邮箱账号管理</h1>
                <p className="text-sm leading-7 text-[var(--muted)]">
                  当前登录管理员：{username}，共 {total} 条有效记录。
                </p>
              </div>
              <div className="grid flex-1 gap-3 md:grid-cols-3 lg:max-w-3xl">
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    关联状态
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--muted)]">未关联</p>
                      <p className="mt-1 text-2xl font-semibold">{stats.unlinkedCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--muted)]">已关联</p>
                      <p className="mt-1 text-2xl font-semibold">{stats.linkedCount}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">有效邮箱数量分布</p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    失效占比
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {stats.expiredPercentage.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">已失效 / 全部有效记录</p>
                </div>
                <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    平均存活
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {stats.averageLinkedLifetimeDays === null
                      ? "-"
                      : `${stats.averageLinkedLifetimeDays.toFixed(1)}天`}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    已关联且已失效邮箱平均时长
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)]"
                  onClick={() => {
                    setEditingRecord(null);
                    setDialogMode("create");
                  }}
                >
                  新增邮箱账号
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm"
                  onClick={handleLogout}
                >
                  退出登录
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
            <form
              className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end"
              action="/dashboard"
            >
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">搜索</span>
                <input
                  name="keyword"
                  defaultValue={searchParams.keyword ?? ""}
                  placeholder="按邮箱账号名称或用户姓名搜索"
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">邮箱域名</span>
                <select
                  name="domain"
                  defaultValue={searchParams.domain ?? ""}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">全部</option>
                  {emailDomainOptions.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">是否关联 s2a</span>
                <select
                  name="linked"
                  defaultValue={searchParams.linked ?? ""}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">全部</option>
                  <option value="true">已关联</option>
                  <option value="false">未关联</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">是否失效</span>
                <select
                  name="expired"
                  defaultValue={searchParams.expired ?? ""}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">全部</option>
                  <option value="true">已失效</option>
                  <option value="false">未失效</option>
                </select>
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)]"
                >
                  查询
                </button>
                <a
                  href="/dashboard"
                  className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm"
                >
                  重置
                </a>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[var(--panel-strong)]">
                  <tr className="text-left text-sm text-[var(--muted)]">
                    {[
                      "邮箱账号名称",
                      "用户姓名",
                      "用户生日",
                      "注册时间",
                      "注册地点",
                      "是否关联 s2a",
                      "关联时间",
                      "是否已失效",
                      "失效时间",
                      "操作",
                    ].map((label) => (
                      <th key={label} className="border-b border-[var(--border)] px-4 py-4 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr key={item.id} className="text-sm transition hover:bg-white/70">
                        <td
                          className={`border-b border-[var(--border)] px-4 py-4 font-medium ${getEmailNameColorClass(item)}`}
                        >
                          {item.email_name}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {item.user_name}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {formatDate(item.birthday)}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {formatDateOnly(item.registered_at)}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {item.registered_location}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {item.is_linked_s2a ? "是" : "否"}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {formatDateOnly(item.linked_at)}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {item.is_expired ? "是" : "否"}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {formatDateOnly(item.expired_at)}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs"
                              onClick={() => {
                                setEditingRecord(item);
                                setDialogMode("edit");
                              }}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-[var(--danger)]/25 px-3 py-2 text-xs text-[var(--danger)]"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? "删除中..." : "删除"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-sm text-[var(--muted)]"
                      >
                        当前没有符合条件的邮箱账号记录。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            total={total}
            searchParams={searchParams}
          />
        </div>
      </main>

      <EmailAccountFormDialog
        mode={dialogMode === "edit" ? "edit" : "create"}
        open={dialogMode !== null}
        record={editingRecord}
        onClose={() => {
          setDialogMode(null);
          setEditingRecord(null);
        }}
      />
    </>
  );
}
