"use client";

import { useEffect, useState } from "react";

import type {
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferView,
  HeroSmsOperatorOption,
  HeroSmsPurchaseResultView,
  HeroSmsServiceOption,
} from "@/lib/hero-sms/types";

type HeroSmsReadonlyClientProps = {
  initialBalance: HeroSmsBalanceView;
  initialServices: HeroSmsServiceOption[];
  initialCountries: HeroSmsCountryOption[];
};

type OptionsResponse = {
  services: HeroSmsServiceOption[];
  countries: HeroSmsCountryOption[];
};

type BalanceResponse = HeroSmsBalanceView;

type OfferResponse = {
  offer: HeroSmsOfferView | null;
};

type OperatorsResponse = {
  operators: HeroSmsOperatorOption[];
};

type PurchaseResponse = {
  result: HeroSmsPurchaseResultView;
};

const CURRENCY_LABELS: Record<number, string> = {
  840: "USD",
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function filterServices(services: HeroSmsServiceOption[], keyword: string): HeroSmsServiceOption[] {
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

function filterCountries(
  countries: HeroSmsCountryOption[],
  keyword: string,
): HeroSmsCountryOption[] {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return [];
  }

  return countries
    .filter((country) => {
      const name = country.name.toLowerCase();
      const id = String(country.id);

      return name.includes(normalizedKeyword) || id.includes(normalizedKeyword);
    })
    .slice(0, 12);
}

function formatBeijingTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return `${value}（北京时间）`;
  }

  return `${new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)}（北京时间）`;
}

function getCurrencyLabel(code: number): string {
  return CURRENCY_LABELS[code] ?? `货币代码 ${code}`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getActivationDurationMs(result: HeroSmsPurchaseResultView | null): number | null {
  if (!result) {
    return null;
  }

  const activationStart = new Date(result.activationTime).getTime();
  const activationEnd = new Date(result.activationEndTime).getTime();

  if (
    Number.isNaN(activationStart) ||
    Number.isNaN(activationEnd) ||
    activationEnd <= activationStart
  ) {
    return null;
  }

  return activationEnd - activationStart;
}

export function HeroSmsReadonlyClient({
  initialBalance,
  initialServices,
  initialCountries,
}: HeroSmsReadonlyClientProps) {
  const [balance, setBalance] = useState(initialBalance.balance);
  const [services, setServices] = useState(initialServices);
  const [countries, setCountries] = useState(initialCountries);
  const [selectedService, setSelectedService] = useState(initialServices[0]?.code ?? "");
  const [selectedCountry, setSelectedCountry] = useState(
    initialCountries[0] ? String(initialCountries[0].id) : "",
  );
  const [serviceKeyword, setServiceKeyword] = useState("");
  const [countryKeyword, setCountryKeyword] = useState("");
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseResult, setPurchaseResult] = useState<HeroSmsPurchaseResultView | null>(null);
  const [offer, setOffer] = useState<HeroSmsOfferView | null>(null);
  const [pageError, setPageError] = useState("");
  const [offerError, setOfferError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingOffer, setIsLoadingOffer] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [operators, setOperators] = useState<HeroSmsOperatorOption[]>([]);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [operatorError, setOperatorError] = useState("");
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [purchaseLocalStartedAt, setPurchaseLocalStartedAt] = useState<number | null>(null);

  const selectedServiceOption = services.find((service) => service.code === selectedService) ?? null;
  const selectedCountryOption =
    countries.find((country) => String(country.id) === selectedCountry) ?? null;
  const serviceMatches = filterServices(services, serviceKeyword);
  const countryMatches = filterCountries(countries, countryKeyword);

  async function loadOperators(country: string) {
    if (!country) {
      setOperators([]);
      setSelectedOperator("");
      setOperatorError("");
      return;
    }

    setIsLoadingOperators(true);
    setOperatorError("");

    try {
      const response = await fetch(
        `/api/hero-sms/operators?country=${encodeURIComponent(country)}`,
      );
      const result = (await response.json()) as OperatorsResponse & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "查询运营商失败");
      }

      setOperators(result.operators);
      setSelectedOperator((current) =>
        result.operators.some((item) => item.code === current) ? current : "",
      );
    } catch (error) {
      setOperators([]);
      setSelectedOperator("");
      setOperatorError(error instanceof Error ? error.message : "查询运营商失败");
    } finally {
      setIsLoadingOperators(false);
    }
  }

  async function loadOffer(service: string, country: string) {
    if (!service || !country) {
      setOffer(null);
      setOfferError("");
      return;
    }

    setIsLoadingOffer(true);
    setOfferError("");

    try {
      const response = await fetch(
        `/api/hero-sms/offers?service=${encodeURIComponent(service)}&country=${encodeURIComponent(country)}`,
      );
      const result = (await response.json()) as OfferResponse & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "查询报价失败");
      }

      setOffer(result.offer ?? null);
    } catch (error) {
      setOffer(null);
      setOfferError(error instanceof Error ? error.message : "查询报价失败");
    } finally {
      setIsLoadingOffer(false);
    }
  }

  async function refreshAll() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setPageError("");

    try {
      const [balanceResponse, optionsResponse] = await Promise.all([
        fetch("/api/hero-sms/balance"),
        fetch("/api/hero-sms/options"),
      ]);
      const balanceResult = (await balanceResponse.json()) as BalanceResponse & { error?: string };
      const optionsResult = (await optionsResponse.json()) as OptionsResponse & { error?: string };

      if (!balanceResponse.ok) {
        throw new Error(balanceResult.error ?? "刷新余额失败");
      }

      if (!optionsResponse.ok) {
        throw new Error(optionsResult.error ?? "刷新选项失败");
      }

      setBalance(balanceResult.balance);
      setServices(optionsResult.services);
      setCountries(optionsResult.countries);

      const nextService =
        optionsResult.services.find((item) => item.code === selectedService)?.code ??
        optionsResult.services[0]?.code ??
        "";
      const nextCountry =
        optionsResult.countries.find((item) => String(item.id) === selectedCountry)?.id ??
        optionsResult.countries[0]?.id;

      setSelectedService(nextService);
      setSelectedCountry(nextCountry ? String(nextCountry) : "");
      setServiceKeyword("");
      setCountryKeyword("");

      await Promise.all([
        loadOffer(nextService, nextCountry ? String(nextCountry) : ""),
        loadOperators(nextCountry ? String(nextCountry) : ""),
      ]);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "刷新失败");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handlePurchase() {
    if (isPurchasing) {
      return;
    }

    if (!selectedService) {
      setPurchaseError("请先选择服务。");
      return;
    }

    if (!selectedCountry) {
      setPurchaseError("请先选择国家。");
      return;
    }

    const normalizedPrice = purchasePrice.trim();

    if (!normalizedPrice) {
      setPurchaseError("请输入购置价格。");
      return;
    }

    const numericPrice = Number(normalizedPrice);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setPurchaseError("请输入有效的正数价格。");
      return;
    }

    setIsPurchasing(true);
    setPurchaseError("");
    setPurchaseResult(null);

    try {
      const response = await fetch("/api/hero-sms/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service: selectedService,
          country: Number(selectedCountry),
          maxPrice: normalizedPrice,
          operator: selectedOperator,
        }),
      });
      const result = (await response.json()) as PurchaseResponse & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "购买失败");
      }

      setPurchaseLocalStartedAt(Date.now());
      setPurchaseResult(result.result);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "购买失败");
    } finally {
      setIsPurchasing(false);
    }
  }

  useEffect(() => {
    void loadOffer(selectedService, selectedCountry);
  }, [selectedService, selectedCountry]);

  useEffect(() => {
    void loadOperators(selectedCountry);
  }, [selectedCountry]);

  async function copyText(value: string, field: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? "" : current));
      }, 1200);
    } catch {
      setCopiedField("");
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const purchaseActivatedAt =
    getActivationDurationMs(purchaseResult);
  const purchaseDeadline =
    purchaseActivatedAt === null || purchaseLocalStartedAt === null
      ? null
      : purchaseLocalStartedAt + purchaseActivatedAt;
  const countdownRemaining =
    purchaseDeadline === null ? null : Math.max(purchaseDeadline - countdownNow, 0);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
                HeroSMS
              </p>
              <h1 className="text-3xl font-semibold">短信接码验证</h1>
              <p className="text-sm leading-7 text-[var(--muted)]">
                这一页先验证余额、选项、报价和单次购买结果，暂时不做活动列表。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/dashboard"
                className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm"
              >
                返回邮箱管理
              </a>
              <button
                type="button"
                className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={refreshAll}
                disabled={isRefreshing}
              >
                {isRefreshing ? "刷新中..." : "手动刷新"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">账户余额</p>
            <p className="mt-3 text-3xl font-semibold">{balance}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              保留 HeroSMS 原始精度，不做四舍五入。
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">报价验证</p>
              <h2 className="mt-2 text-2xl font-semibold">选择条件与当前最低个人价</h2>
            </div>
            {isLoadingOffer ? <p className="text-sm text-[var(--muted)]">读取中...</p> : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
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
                  onClick={() => {
                    setIsServicePickerOpen((current) => !current);
                    setIsCountryPickerOpen(false);
                  }}
                >
                  <span className={selectedServiceOption ? "" : "text-[var(--muted)]"}>
                    {selectedServiceOption
                      ? `${selectedServiceOption.name} (${selectedServiceOption.code})`
                      : "点击搜索服务"}
                  </span>
                  <span className="text-xs text-[var(--muted)]">⌕</span>
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
            <div
              className="grid gap-2 text-sm"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsCountryPickerOpen(false);
                }
              }}
            >
              <span className="text-[var(--muted)]">国家</span>
              <div className="relative">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left"
                  onClick={() => {
                    setIsCountryPickerOpen((current) => !current);
                    setIsServicePickerOpen(false);
                  }}
                >
                  <span className={selectedCountryOption ? "" : "text-[var(--muted)]"}>
                    {selectedCountryOption
                      ? `${selectedCountryOption.name} (${selectedCountryOption.id})`
                      : "点击搜索国家"}
                  </span>
                  <span className="text-xs text-[var(--muted)]">⌕</span>
                </button>
                {isCountryPickerOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-[var(--shadow)]">
                    <input
                      autoFocus
                      value={countryKeyword}
                      onChange={(event) => setCountryKeyword(event.target.value)}
                      placeholder="输入国家名称或编号搜索"
                      className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                    />
                    {countryKeyword ? (
                      countryMatches.length > 0 ? (
                        <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-[var(--border)] bg-white">
                          {countryMatches.map((country) => (
                            <button
                              key={country.id}
                              type="button"
                              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[var(--panel-strong)]"
                              onClick={() => {
                                setSelectedCountry(String(country.id));
                                setCountryKeyword("");
                                setIsCountryPickerOpen(false);
                              }}
                            >
                              <span>{country.name}</span>
                              <span className="text-[var(--muted)]">{country.id}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--muted)]">
                          没有匹配到国家。
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
              <span className="text-[var(--muted)]">运营商</span>
              <select
                value={selectedOperator}
                onChange={(event) => setSelectedOperator(event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                disabled={isLoadingOperators}
              >
                <option value="">
                  {isLoadingOperators ? "运营商读取中..." : "任意运营商"}
                </option>
                {operators.map((operator) => (
                  <option key={operator.code} value={operator.code}>
                    {operator.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {pageError ? (
            <p className="mt-4 rounded-2xl border border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,white)] px-4 py-3 text-sm text-[var(--danger)]">
              {pageError}
            </p>
          ) : null}

          {operatorError ? (
            <p className="mt-4 rounded-2xl border border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,white)] px-4 py-3 text-sm text-[var(--danger)]">
              {operatorError}
            </p>
          ) : null}

          {offerError ? (
            <p className="mt-5 rounded-2xl border border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,white)] px-4 py-3 text-sm text-[var(--danger)]">
              {offerError}
            </p>
          ) : null}

          {!isLoadingOffer && !offerError && !offer ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white px-5 py-8 text-sm text-[var(--muted)]">
              当前组合暂无报价或暂不可售。
            </div>
          ) : null}

          {offer ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                  最低个人价
                </p>
                <p className="mt-3 text-3xl font-semibold">{offer.minPrice}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                  默认价
                </p>
                <p className="mt-3 text-2xl font-semibold">{offer.defaultPrice}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                  零售价
                </p>
                <p className="mt-3 text-2xl font-semibold">{offer.retailPrice}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                  可售总量
                </p>
                <p className="mt-3 text-2xl font-semibold">{offer.totalCount}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  实体 {offer.physicalCount} / 默认价位 {offer.defaultPriceCount}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">购买验证</p>
              <h2 className="text-2xl font-semibold">购买 1 条号码</h2>
              <p className="text-sm leading-7 text-[var(--muted)]">
                当前只做单次购买验证，不落库，不做活动列表。
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:flex-row lg:items-end">
              <label className="grid flex-1 gap-2 text-sm">
                <span className="text-[var(--muted)]">购置价格</span>
                <input
                  value={purchasePrice}
                  onChange={(event) => setPurchasePrice(event.target.value)}
                  placeholder={
                    offer ? `例如 ${offer.minPrice}` : "请输入你希望的最高购置价格"
                  }
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </label>
              <button
                type="button"
                className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handlePurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? "购买中..." : "购买 1 条号码"}
              </button>
            </div>
          </div>

          {purchaseError ? (
            <p className="mt-5 rounded-2xl border border-[var(--danger)]/25 bg-[color:color-mix(in_srgb,var(--danger)_8%,white)] px-4 py-3 text-sm text-[var(--danger)]">
              {purchaseError}
            </p>
          ) : null}

          {purchaseResult ? (
            <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
                    本次购买结果
                  </p>
                  <button
                    type="button"
                    className="mt-2 cursor-pointer text-left text-2xl font-semibold transition hover:opacity-75"
                    onClick={() => copyText(purchaseResult.phoneNumber, "phone")}
                    title="点击复制号码"
                  >
                    {purchaseResult.phoneNumber}
                  </button>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {copiedField === "phone" ? "号码已复制" : "点击号码可复制"}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium">
                  activationId: {purchaseResult.activationId}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    实际价格
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {purchaseResult.activationCost} {getCurrencyLabel(purchaseResult.currency)}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    剩余有效时间
                  </p>
                  <p className="mt-2 text-sm font-semibold break-all">
                    {countdownRemaining === null ? "待确认" : formatCountdown(countdownRemaining)}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {purchaseDeadline === null
                      ? "未能从 activationTime 与 activationEndTime 推算有效时长"
                      : `按接口返回的有效时长推算，截止 ${formatBeijingTime(
                          new Date(purchaseDeadline).toISOString(),
                        )}`}
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    运营商
                  </p>
                  <p className="mt-2 text-xl font-semibold">{purchaseResult.activationOperator}</p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    国家
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {selectedCountryOption?.name ?? `国家 ${purchaseResult.countryCode}`}（+
                    {purchaseResult.countryPhoneCode}）
                  </p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    可重复接收短信
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {purchaseResult.canGetAnotherSms ? "是" : "否"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
