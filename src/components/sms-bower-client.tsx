"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  SmsBowerActivationView,
  SmsBowerCountryOption,
  SmsBowerPriceResult,
  SmsBowerPurchaseResult,
  SmsBowerServiceOption,
} from "@/lib/sms-bower/types";
import { splitPhoneNumberByKnownDialCode } from "@/lib/phone-numbers";

type SmsBowerClientProps = {
  initialServices: SmsBowerServiceOption[];
  initialCountries: SmsBowerCountryOption[];
  initialActivations: SmsBowerActivationView[];
};

type PricesResponse = {
  items: SmsBowerPriceResult[];
  error?: string;
};

type PurchaseResponse = {
  result?: SmsBowerPurchaseResult;
  pending?: boolean;
  error?: string;
};

type ActivationsResponse = {
  items: SmsBowerActivationView[];
  error?: string;
};

type PurchaseState = "requesting" | "waiting";

const PURCHASE_RETRY_INTERVAL_MS = 2000;
const PURCHASE_MAX_WAIT_MS = 5 * 60 * 1000;

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function filterServices(
  services: SmsBowerServiceOption[],
  keyword: string,
): SmsBowerServiceOption[] {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  return services
    .filter((service) => {
      const name = service.name.toLowerCase();
      const code = service.code.toLowerCase();

      return name.includes(normalizedKeyword) || code.includes(normalizedKeyword);
    })
    .slice(0, 12);
}

function getRankClassName(rankId: number | null): string {
  switch (rankId) {
    case 1:
      return "border-amber-300 bg-amber-50 text-amber-700";
    case 2:
      return "border-zinc-300 bg-zinc-50 text-zinc-700";
    case 3:
      return "border-orange-300 bg-orange-50 text-orange-700";
    default:
      return "border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted)]";
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getSmsBowerSmsDisplay(item: SmsBowerActivationView): string {
  return item.smsCode?.trim() || item.smsText?.trim() || "等待接收短信";
}

export function SmsBowerClient({ initialServices, initialActivations }: SmsBowerClientProps) {
  const [services] = useState(initialServices);
  const [selectedService, setSelectedService] = useState("");
  const [serviceKeyword, setServiceKeyword] = useState("");
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [items, setItems] = useState<SmsBowerPriceResult[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [purchaseStates, setPurchaseStates] = useState<Record<string, PurchaseState>>({});
  const [purchaseResults, setPurchaseResults] = useState<SmsBowerPurchaseResult[]>([]);
  const [activations, setActivations] = useState(initialActivations);
  const [isRefreshingActivations, setIsRefreshingActivations] = useState(false);
  const [activationActionId, setActivationActionId] = useState("");
  const purchaseAbortControllersRef = useRef(new Map<string, AbortController>());
  const cancelledPurchaseIdsRef = useRef(new Set<string>());

  const selectedServiceOption =
    services.find((service) => service.code === selectedService) ?? null;
  const serviceMatches = useMemo(
    () => filterServices(services, serviceKeyword),
    [serviceKeyword, services],
  );
  const shouldPollActivations = activations.some((item) =>
    ["STATUS_WAIT_CODE", "STATUS_WAIT_RETRY"].includes(item.activationStatus),
  );

  async function loadActivations() {
    const response = await fetch("/api/sms-bower/activations", {
      cache: "no-store",
    });
    const result = (await response.json()) as ActivationsResponse;

    if (!response.ok) {
      throw new Error(result.error ?? "读取活动号码失败");
    }

    setActivations(result.items);
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
  }

  async function refreshActivationStatus() {
    if (isRefreshingActivations) {
      return;
    }

    setIsRefreshingActivations(true);
    setError("");

    try {
      const response = await fetch("/api/sms-bower/activations/refresh", {
        method: "POST",
      });
      const result = (await response.json()) as ActivationsResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "刷新短信状态失败");
      }

      setActivations(result.items);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "刷新短信状态失败");
    } finally {
      setIsRefreshingActivations(false);
    }
  }

  async function handleActivationAction(
    item: SmsBowerActivationView,
    action: "cancel" | "finish" | "retry-sms",
  ) {
    if (activationActionId) {
      return;
    }

    setActivationActionId(item.id);
    setError("");

    try {
      const response = await fetch(`/api/sms-bower/activations/${item.id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "操作失败");
      }

      await loadActivations();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "操作失败");
    } finally {
      setActivationActionId("");
    }
  }

  useEffect(() => {
    if (!shouldPollActivations) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadActivations().catch(() => {
        // 本地轮询只用于接收 webhook 写库后的新状态，失败时不打扰当前操作。
      });
    }, 3000);

    return () => {
      window.clearInterval(timer);
    };
  }, [shouldPollActivations]);

  async function handleSearch() {
    if (isSearching) {
      return;
    }

    if (!selectedService) {
      setError("请先选择服务。");
      return;
    }

    if (!selectedServiceOption?.id) {
      setError("当前服务缺少可查询的数字 ID，无法使用前台价格接口。");
      return;
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (!Number.isFinite(min) || min < 0) {
      setError("请输入有效的最低价。");
      return;
    }

    if (!Number.isFinite(max) || max <= 0 || max < min) {
      setError("请输入有效的最高价。");
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const params = new URLSearchParams({
        service: selectedService,
        serviceId: String(selectedServiceOption.id),
        minPrice: String(min),
        maxPrice: String(max),
      });
      const response = await fetch(`/api/sms-bower/prices?${params.toString()}`);
      const result = (await response.json()) as PricesResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "查询失败");
      }

      setItems(result.items);
    } catch (searchError) {
      setItems([]);
      setError(searchError instanceof Error ? searchError.message : "查询失败");
    } finally {
      setIsSearching(false);
    }
  }

  async function handlePurchase(item: SmsBowerPriceResult) {
    if (purchaseStates[item.id]) {
      return;
    }

    const abortController = new AbortController();
    purchaseAbortControllersRef.current.set(item.id, abortController);
    cancelledPurchaseIdsRef.current.delete(item.id);
    setPurchaseStates((current) => ({
      ...current,
      [item.id]: "requesting",
    }));
    setError("");

    try {
      const deadline = Date.now() + PURCHASE_MAX_WAIT_MS;
      let shouldNotifyOnSuccess = false;

      while (Date.now() <= deadline) {
        if (cancelledPurchaseIdsRef.current.has(item.id)) {
          return;
        }

        const response = await fetch("/api/sms-bower/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
          body: JSON.stringify({
            serviceCode: item.serviceCode,
            serviceName: selectedServiceOption?.name ?? item.serviceCode,
            countryCode: item.countryCode,
            countryName: item.countryName,
            price: item.price,
            providerId: item.providerId,
            providerIds: item.providerIds,
            notifyOnSuccess: shouldNotifyOnSuccess,
          }),
        });
        const result = (await response.json()) as PurchaseResponse;

        if (response.status === 409 && result.pending) {
          shouldNotifyOnSuccess = true;
          setPurchaseStates((current) => ({
            ...current,
            [item.id]: "waiting",
          }));
          await sleep(PURCHASE_RETRY_INTERVAL_MS);
          continue;
        }

        if (!response.ok || !result.result) {
          throw new Error(result.error ?? "购买失败");
        }

        setPurchaseResults((current) => [result.result as SmsBowerPurchaseResult, ...current].slice(0, 5));
        await loadActivations();
        return;
      }

      throw new Error("5 分钟内没有拿到号码，请稍后再试。");
    } catch (purchaseError) {
      if (purchaseError instanceof DOMException && purchaseError.name === "AbortError") {
        return;
      }

      setError(purchaseError instanceof Error ? purchaseError.message : "购买失败");
    } finally {
      purchaseAbortControllersRef.current.delete(item.id);
      cancelledPurchaseIdsRef.current.delete(item.id);
      setPurchaseStates((current) => {
        const next = { ...current };
        delete next[item.id];
        return next;
      });
    }
  }

  function cancelPendingPurchase(itemId: string) {
    cancelledPurchaseIdsRef.current.add(itemId);
    purchaseAbortControllersRef.current.get(itemId)?.abort();
    purchaseAbortControllersRef.current.delete(itemId);
    setPurchaseStates((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-6 py-4 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold">Bower 价格筛选</h1>
            <a
              href="/dashboard"
              className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm"
            >
              返回邮箱管理
            </a>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">活动号码</p>
              <h2 className="mt-2 text-2xl font-semibold">当前等待短信的号码</h2>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => void refreshActivationStatus()}
              disabled={isRefreshingActivations || activations.length === 0}
            >
              {isRefreshingActivations ? "刷新中..." : "刷新短信状态"}
            </button>
          </div>

          {activations.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white px-5 py-8 text-sm text-[var(--muted)]">
              当前还没有活动中的 SMS Bower 号码。
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-[24px] border border-[var(--border)] bg-white">
              <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
                <thead className="bg-[var(--panel-strong)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="w-[22%] px-4 py-3 font-medium">号码</th>
                    <th className="w-[16%] px-4 py-3 font-medium">成本</th>
                    <th className="w-[18%] px-4 py-3 font-medium">国家</th>
                    <th className="w-[16%] px-4 py-3 font-medium">状态</th>
                    <th className="w-[13%] px-4 py-3 font-medium">最新短信</th>
                    <th className="w-[15%] px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {activations.map((item) => (
                    <tr key={item.id} className="align-middle">
                      <td className="border-t border-[var(--border)] px-4 py-3 font-medium">
                        {(() => {
                          const phone = splitPhoneNumberByKnownDialCode(item.phoneNumber);

                          return (
                            <span className="inline-flex max-w-full items-baseline gap-2">
                              {phone.dialCode ? (
                                <span className="shrink-0 text-[var(--muted)]">{phone.dialCode}</span>
                              ) : null}
                              <button
                                type="button"
                                className="min-w-0 truncate text-left font-semibold transition hover:opacity-75"
                                onClick={() => void copyText(phone.localNumber)}
                                title="点击复制不含区号的号码"
                              >
                                {phone.localNumber}
                              </button>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3">
                        {item.activationCost}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3">
                        <p>{item.countryName}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">{item.serviceName}</p>
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3 font-medium">
                        {item.activationStatusText}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-[var(--muted)]">
                        {getSmsBowerSmsDisplay(item)}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-right">
                        <div className="flex min-h-8 items-center justify-end gap-2 whitespace-nowrap">
                          {item.smsCode || item.smsText ? (
                            <>
                              {item.canGetAnotherSms ? (
                                <button
                                  type="button"
                                  className="h-8 rounded-xl border border-[var(--border)] px-3 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                                  onClick={() => void handleActivationAction(item, "retry-sms")}
                                  disabled={Boolean(activationActionId)}
                                >
                                  再次接收
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="h-8 rounded-xl border border-[var(--border)] px-3 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={() => void handleActivationAction(item, "finish")}
                                disabled={Boolean(activationActionId)}
                              >
                                完成
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="h-8 rounded-xl border border-[var(--border)] px-3 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                              onClick={() => void handleActivationAction(item, "cancel")}
                              disabled={Boolean(activationActionId)}
                            >
                              取消
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(130px,0.45fr)_minmax(130px,0.45fr)_auto]">
            <div
              className="grid gap-2 text-sm"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsServicePickerOpen(false);
                }
              }}
            >
              <span className="text-[var(--muted)]">服务</span>
              <div className="relative">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left"
                  onClick={() => setIsServicePickerOpen((current) => !current)}
                >
                  <span className={selectedServiceOption ? "" : "text-[var(--muted)]"}>
                    {selectedServiceOption
                      ? `${selectedServiceOption.name} (${selectedServiceOption.code})`
                      : "点击搜索服务"}
                  </span>
                  <span className="inline-flex w-7 justify-center text-2xl leading-none text-[var(--muted)]">
                    ⌕
                  </span>
                </button>
                {isServicePickerOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]">
                    <input
                      autoFocus
                      value={serviceKeyword}
                      onChange={(event) => setServiceKeyword(event.target.value)}
                      placeholder="输入服务名称或代码搜索"
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                    />
                    {serviceKeyword ? (
                      serviceMatches.length > 0 ? (
                        <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-[var(--border)] bg-white">
                          {serviceMatches.map((service) => (
                            <button
                              key={service.code}
                              type="button"
                              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[var(--panel-strong)]"
                              onClick={() => {
                                setSelectedService(service.code);
                                setServiceKeyword("");
                                setIsServicePickerOpen(false);
                              }}
                            >
                              <span>{service.name}</span>
                              <span className="text-[var(--muted)]">{service.code}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--muted)]">
                          没有匹配到服务。
                        </p>
                      )
                    ) : (
                      <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--muted)]">
                        输入关键词后显示匹配结果。
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">最低价</span>
              <input
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="例如 0.02"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">最高价</span>
              <input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="例如 0.05"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <div className="grid items-end">
              <button
                type="button"
                className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold whitespace-nowrap text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? "查询中..." : "查询国家"}
              </button>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-[var(--danger)]">{error}</p> : null}

          {purchaseResults.length > 0 ? (
            <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 text-sm">
              <p className="font-semibold">最近购买成功</p>
              <div className="mt-2 grid gap-2 text-[var(--muted)]">
                {purchaseResults.map((item) => (
                  <p key={item.activationId}>
                    activationId：{item.activationId}，号码：{item.phoneNumber}，
                    成本：{item.activationCost}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">结果</p>
              <h2 className="mt-2 text-2xl font-semibold">符合价位区间的国家</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">{items.length} 条</p>
          </div>

          {items.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white px-5 py-8 text-sm text-[var(--muted)]">
              选择服务并输入价格区间后，这里会显示所有符合条件的国家和供应商。
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-[24px] border border-[var(--border)] bg-white">
              <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
                <thead className="bg-[var(--panel-strong)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="w-[24%] px-4 py-3 font-medium">国家</th>
                    <th className="w-[14%] px-4 py-3 font-medium">职级</th>
                    <th className="w-[18%] px-4 py-3 font-medium">Provider</th>
                    <th className="w-[13%] px-4 py-3 font-medium">价格</th>
                    <th className="w-[12%] px-4 py-3 font-medium">库存</th>
                    <th className="w-[19%] px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="align-middle">
                      <td className="border-t border-[var(--border)] px-4 py-3">
                        <p className="font-medium">{item.countryName}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {item.countryCode}
                          {item.countryType === "virtual" ? " · 虚拟" : ""}
                        </p>
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRankClassName(item.rankId)}`}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3">
                        {item.providerCount > 1
                          ? `${item.providerId} 等 ${item.providerCount} 个`
                          : item.providerId}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3 font-semibold">
                        {item.price}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3">{item.count}</td>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-right">
                        {purchaseStates[item.id] ? (
                          <button
                            type="button"
                            className="rounded-2xl border border-[var(--danger)] px-4 py-2 text-xs font-semibold text-[var(--danger)]"
                            onClick={() => cancelPendingPurchase(item.id)}
                          >
                            {purchaseStates[item.id] === "waiting" ? "停止等待" : "取消购买"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)]"
                            onClick={() => void handlePurchase(item)}
                          >
                            购买 1 条号码
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
