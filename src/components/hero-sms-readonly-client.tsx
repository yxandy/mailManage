"use client";

import { useEffect, useState } from "react";

import type {
  HeroSmsBalanceView,
  HeroSmsCountryOption,
  HeroSmsOfferView,
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
  const [offer, setOffer] = useState<HeroSmsOfferView | null>(null);
  const [pageError, setPageError] = useState("");
  const [offerError, setOfferError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingOffer, setIsLoadingOffer] = useState(false);

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

      await loadOffer(nextService, nextCountry ? String(nextCountry) : "");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "刷新失败");
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOffer(selectedService, selectedCountry);
  }, [selectedService, selectedCountry]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
                HeroSMS
              </p>
              <h1 className="text-3xl font-semibold">短信接码只读验证</h1>
              <p className="text-sm leading-7 text-[var(--muted)]">
                这一页只验证余额、服务、国家和最低个人价读取是否正确，不执行购买。
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
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">账户余额</p>
              <p className="mt-3 text-3xl font-semibold">{balance}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                保留 HeroSMS 原始精度，不做四舍五入。
              </p>
            </div>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">服务</span>
              <select
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={selectedService}
                onChange={(event) => setSelectedService(event.target.value)}
              >
                {services.map((service) => (
                  <option key={service.code} value={service.code}>
                    {service.name} ({service.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-[var(--muted)]">国家</span>
              <select
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                value={selectedCountry}
                onChange={(event) => setSelectedCountry(event.target.value)}
              >
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name} ({country.id})
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
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">报价验证</p>
              <h2 className="mt-2 text-2xl font-semibold">当前最低个人价</h2>
            </div>
            {isLoadingOffer ? <p className="text-sm text-[var(--muted)]">读取中...</p> : null}
          </div>

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
      </div>
    </main>
  );
}
