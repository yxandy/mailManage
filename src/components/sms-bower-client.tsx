"use client";

import { useMemo, useState } from "react";

import type {
  SmsBowerCountryOption,
  SmsBowerPriceResult,
  SmsBowerPurchaseResult,
  SmsBowerServiceOption,
} from "@/lib/sms-bower/types";

type SmsBowerClientProps = {
  initialServices: SmsBowerServiceOption[];
  initialCountries: SmsBowerCountryOption[];
};

type PricesResponse = {
  items: SmsBowerPriceResult[];
  error?: string;
};

type PurchaseResponse = {
  result?: SmsBowerPurchaseResult;
  error?: string;
};

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

export function SmsBowerClient({ initialServices }: SmsBowerClientProps) {
  const [services] = useState(initialServices);
  const [selectedService, setSelectedService] = useState("");
  const [serviceKeyword, setServiceKeyword] = useState("");
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [items, setItems] = useState<SmsBowerPriceResult[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [purchasingId, setPurchasingId] = useState("");
  const [purchaseResult, setPurchaseResult] = useState<SmsBowerPurchaseResult | null>(null);

  const selectedServiceOption =
    services.find((service) => service.code === selectedService) ?? null;
  const serviceMatches = useMemo(
    () => filterServices(services, serviceKeyword),
    [serviceKeyword, services],
  );

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
    setPurchaseResult(null);

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
    if (purchasingId) {
      return;
    }

    setPurchasingId(item.id);
    setError("");
    setPurchaseResult(null);

    try {
      const response = await fetch("/api/sms-bower/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceCode: item.serviceCode,
          countryCode: item.countryCode,
          price: item.price,
          providerId: item.providerId,
        }),
      });
      const result = (await response.json()) as PurchaseResponse;

      if (!response.ok || !result.result) {
        throw new Error(result.error ?? "购买失败");
      }

      setPurchaseResult(result.result);
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : "购买失败");
    } finally {
      setPurchasingId("");
    }
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

          {purchaseResult ? (
            <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 text-sm">
              <p className="font-semibold">购买成功</p>
              <p className="mt-2 text-[var(--muted)]">
                activationId：{purchaseResult.activationId}，号码：{purchaseResult.phoneNumber}，
                成本：{purchaseResult.activationCost}
              </p>
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
                        {item.providerId}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3 font-semibold">
                        {item.price}
                      </td>
                      <td className="border-t border-[var(--border)] px-4 py-3">{item.count}</td>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded-2xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={() => void handlePurchase(item)}
                          disabled={Boolean(purchasingId)}
                        >
                          {purchasingId === item.id ? "购买中..." : "购买 1 条号码"}
                        </button>
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
