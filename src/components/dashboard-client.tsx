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
  tier: "free" | "plus";
  cnyPrice: number;
  emailDomainOptions: string[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string | string[] | undefined>;
};

function toStringArray(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
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

function formatRegisteredDuration(value?: string | null) {
  if (!value) {
    return "-";
  }

  const registeredAt = new Date(value);

  if (Number.isNaN(registeredAt.getTime())) {
    return "-";
  }

  const diffMilliseconds = Date.now() - registeredAt.getTime();

  if (diffMilliseconds < 0) {
    return "0小时0分钟";
  }

  const totalMinutes = Math.floor(diffMilliseconds / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${totalHours}小时${minutes}分钟`;
}

function buildTierHref(
  tier: "free" | "plus",
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "tier") {
      return;
    }

    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(key, item));
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  params.set("tier", tier);
  params.delete("page");

  return `/dashboard?${params.toString()}`;
}

export function DashboardClient({
  username,
  items,
  stats,
  tier,
  cnyPrice,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUpdatingCnyPrice, setIsUpdatingCnyPrice] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(() =>
    toStringArray(searchParams.domain),
  );
  const [isDomainDropdownOpen, setIsDomainDropdownOpen] = useState(false);

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

  async function handleCopyEmail(id: string, emailName: string) {
    try {
      await navigator.clipboard.writeText(emailName);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1200);
    } catch {
      window.alert("复制失败，请检查浏览器剪贴板权限。");
    }
  }

  async function handleUpdateCnyPrice() {
    if (isUpdatingCnyPrice) {
      return;
    }

    const input = window.prompt("请输入人民币数值（最多两位小数）", cnyPrice.toFixed(2));

    if (input === null) {
      return;
    }

    const nextValue = Number(input.trim());

    if (!Number.isFinite(nextValue) || nextValue < 0) {
      window.alert("请输入有效的非负数字。");
      return;
    }

    const roundedValue = Math.round(nextValue * 100) / 100;
    setIsUpdatingCnyPrice(true);

    try {
      const response = await fetch("/api/system-settings/cny-price", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cnyPrice: roundedValue }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "更新失败");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "更新失败");
    } finally {
      setIsUpdatingCnyPrice(false);
    }
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
                  当前登录管理员：{username}，当前为 {tier.toUpperCase()}，共 {total} 条有效记录。
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
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-[var(--muted)]">已关联有效</p>
                      <p className="mt-1 font-semibold">{stats.linkedActiveCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--muted)]">已关联失效</p>
                      <p className="mt-1 font-semibold">{stats.linkedExpiredCount}</p>
                    </div>
                  </div>
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
              <div className="flex flex-col items-start gap-3 lg:items-end">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
                  onClick={handleUpdateCnyPrice}
                  disabled={isUpdatingCnyPrice}
                  title="点击修改人民币数值"
                >
                  ￥ {cnyPrice.toFixed(2)}
                </button>
                <div className="inline-flex overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                  <a
                    href={buildTierHref("free", searchParams)}
                    className={`px-4 py-3 text-sm font-medium ${
                      tier === "free"
                        ? "bg-[var(--primary)] !text-white"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    free
                  </a>
                  <a
                    href={buildTierHref("plus", searchParams)}
                    className={`border-l border-[var(--border)] px-4 py-3 text-sm font-medium ${
                      tier === "plus"
                        ? "bg-[var(--primary)] !text-white"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    plus
                  </a>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/dashboard/hero-sms"
                    className="rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                  >
                    HeroSMS 验证页
                  </a>
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
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
            <form
              className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end"
              action="/dashboard"
            >
              <input type="hidden" name="tier" value={tier} />
              {selectedDomains.map((domain) => (
                <input key={domain} type="hidden" name="domain" value={domain} />
              ))}
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
                <div className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsDomainDropdownOpen(false);
                    }
                  }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left"
                    onClick={() => setIsDomainDropdownOpen((current) => !current)}
                  >
                    <span className="truncate">
                      {selectedDomains.length === 0
                        ? "全部"
                        : selectedDomains.length === 1
                          ? selectedDomains[0]
                          : `已选择 ${selectedDomains.length} 个域名`}
                    </span>
                    <span className="text-xs text-[var(--muted)]">▼</span>
                  </button>
                  {isDomainDropdownOpen ? (
                    <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-[var(--border)] bg-white p-2 shadow-lg">
                      <button
                        type="button"
                        className="mb-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-left text-sm"
                        onClick={() => setSelectedDomains([])}
                      >
                        全部
                      </button>
                      <div className="grid gap-1">
                        {emailDomainOptions.map((domain) => (
                          <label
                            key={domain}
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-stone-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedDomains.includes(domain)}
                              onChange={(event) => {
                                setSelectedDomains((current) => {
                                  if (event.target.checked) {
                                    return [...current, domain];
                                  }

                                  return current.filter((item) => item !== domain);
                                });
                              }}
                            />
                            <span>{domain}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
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
                  href={`/dashboard?tier=${tier}`}
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
                      "注册时间",
                      "注册时长",
                      "注册地点",
                      "是否关联 s2a",
                      "关联时间",
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
                          <div className="flex items-center gap-2">
                            <span>{item.email_name}</span>
                            <button
                              type="button"
                              aria-label={`复制邮箱 ${item.email_name}`}
                              title="复制邮箱"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--primary)] transition hover:border-[var(--primary)] hover:bg-[color:color-mix(in_srgb,var(--primary)_12%,white)]"
                              onClick={() => handleCopyEmail(item.id, item.email_name)}
                            >
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                              >
                                <rect
                                  x="9"
                                  y="3"
                                  width="12"
                                  height="12"
                                  rx="3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <rect
                                  x="3"
                                  y="9"
                                  width="12"
                                  height="12"
                                  rx="3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                            <span
                              className={`inline-block w-10 text-xs text-[var(--muted)] transition-opacity ${
                                copiedId === item.id ? "opacity-100" : "opacity-0"
                              }`}
                            >
                              已复制
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {formatDateOnly(item.registered_at)}
                        </td>
                        <td className="border-b border-[var(--border)] px-4 py-4">
                          {formatRegisteredDuration(item.registered_at)}
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
                        colSpan={7}
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
        emailDomainOptions={emailDomainOptions}
        onClose={() => {
          setDialogMode(null);
          setEditingRecord(null);
        }}
      />
    </>
  );
}
