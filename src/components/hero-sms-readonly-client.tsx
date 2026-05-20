"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  HeroSmsActivationView,
  HeroSmsBalanceView,
  HeroSmsCostSummaryView,
  HeroSmsCountryOption,
  HeroSmsFavoriteView,
  HeroSmsOfferView,
  HeroSmsOperatorOption,
  HeroSmsPurchaseErrorView,
  HeroSmsServiceOption,
} from "@/lib/hero-sms/types";
import {
  canCancelHeroSmsActivation,
  getHeroSmsActivationSmsDisplay,
  getHeroSmsCancelLockRemainingMs,
  hasHeroSmsActivationReceivedSms,
} from "@/lib/hero-sms/activations";

type HeroSmsReadonlyClientProps = {
  initialBalance: HeroSmsBalanceView;
  initialCostSummary: HeroSmsCostSummaryView;
  initialServices: HeroSmsServiceOption[];
  initialCountries: HeroSmsCountryOption[];
  initialActivations: HeroSmsActivationView[];
  initialFavorites: HeroSmsFavoriteView[];
};

type OptionsResponse = {
  services: HeroSmsServiceOption[];
  countries: HeroSmsCountryOption[];
};

type BalanceResponse = HeroSmsBalanceView;

type OfferResponse = {
  offer: HeroSmsOfferView | null;
};

type ActivationsResponse = {
  items: HeroSmsActivationView[];
};

type FavoritesResponse = {
  items: HeroSmsFavoriteView[];
};

type ActivationAction = "cancel" | "finish" | "retry-sms";
type PurchasePriceSelection = "manual" | "personal-min" | `tier:${string}`;

type PurchaseResponse = {
  error?: string;
  purchaseError?: HeroSmsPurchaseErrorView;
};

const HERO_SMS_AUTO_RETRY_INTERVAL_SECONDS = 8;
const HERO_SMS_AUTO_RETRY_MAX_ATTEMPTS = 75;
const HERO_SMS_ACTIVATIONS_AUTO_REFRESH_INTERVAL_MS = 3000;
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

function getCurrencyLabel(code: number): string {
  return CURRENCY_LABELS[code] ?? `货币代码 ${code}`;
}

function formatCompactCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "";
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 1 : 2)}万`;
  }

  return String(value);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) {
    return "0秒";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}时 ${String(minutes).padStart(2, "0")}分 ${String(seconds).padStart(2, "0")}秒`;
  }

  if (minutes > 0) {
    return `${minutes}分 ${String(seconds).padStart(2, "0")}秒`;
  }

  return `${seconds}秒`;
}

export function HeroSmsReadonlyClient({
  initialBalance,
  initialCostSummary,
  initialServices,
  initialCountries,
  initialActivations,
  initialFavorites,
}: HeroSmsReadonlyClientProps) {
  const initialFavorite = initialFavorites[0] ?? null;
  const [balance, setBalance] = useState(initialBalance.balance);
  const [services, setServices] = useState(initialServices);
  const [countries, setCountries] = useState(initialCountries);
  const [selectedService, setSelectedService] = useState(initialFavorite?.serviceCode ?? "");
  const [selectedCountry, setSelectedCountry] = useState(
    initialFavorite ? String(initialFavorite.countryId) : "",
  );
  const [serviceKeyword, setServiceKeyword] = useState("");
  const [countryKeyword, setCountryKeyword] = useState("");
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchasePriceSelection, setPurchasePriceSelection] =
    useState<PurchasePriceSelection>("personal-min");
  const [purchaseError, setPurchaseError] = useState("");
  const [activations, setActivations] = useState(initialActivations);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [offer, setOffer] = useState<HeroSmsOfferView | null>(null);
  const [pageError, setPageError] = useState("");
  const [offerError, setOfferError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPollingActivations, setIsPollingActivations] = useState(false);
  const [isLoadingOffer, setIsLoadingOffer] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [operators, setOperators] = useState<HeroSmsOperatorOption[]>([]);
  const [selectedOperator, setSelectedOperator] = useState(initialFavorite?.operatorCode ?? "");
  const [operatorError, setOperatorError] = useState("");
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [actioningActivationId, setActioningActivationId] = useState("");
  const [isBatchCancelling, setIsBatchCancelling] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const [showDigitsOnly, setShowDigitsOnly] = useState(true);
  const [purchaseLogs, setPurchaseLogs] = useState<string[]>([]);
  const [autoRetryAttempt, setAutoRetryAttempt] = useState(0);
  const [autoRetryCountdown, setAutoRetryCountdown] = useState(0);
  const [isStoppingRetry, setIsStoppingRetry] = useState(false);
  const [isDeletingFavoriteId, setIsDeletingFavoriteId] = useState("");
  const [showAllTierPrices, setShowAllTierPrices] = useState(false);
  const stopRetryRef = useRef(false);

  const formattedBalance = `$${Number(balance).toFixed(4)}`;
  const formattedCost = `$${Number(initialCostSummary.totalCost).toFixed(4)}`;
  const formattedTotalSpend = `$${(
    Number(balance) + Number(initialCostSummary.totalCost)
  ).toFixed(4)}`;
  const selectedServiceOption = services.find((service) => service.code === selectedService) ?? null;
  const selectedCountryOption =
    countries.find((country) => String(country.id) === selectedCountry) ?? null;
  const serviceMatches = filterServices(services, serviceKeyword);
  const countryMatches = filterCountries(countries, countryKeyword);
  const errorLogs = [pageError, operatorError, offerError, purchaseError].filter(Boolean);
  const selectedOfferOperator =
    offer?.operators.find((item) => item.code === (selectedOperator || "any")) ??
    (selectedOperator ? null : offer?.operators[0] ?? null);
  const operatorTierPrices = useMemo(
    () => selectedOfferOperator?.tierPrices ?? offer?.tierPrices ?? [],
    [offer?.tierPrices, selectedOfferOperator?.tierPrices],
  );
  const hasSelectedOperatorPersonalMin =
    !offer || !selectedOfferOperator || selectedOfferOperator.personalMinCount > 0;
  const tierPriceOptions = offer
    ? operatorTierPrices.map((item) => ({
        id: `tier:${item.price}` as const,
        label: item.price,
        count: item.count,
      }))
    : [];
  const visibleTierPriceOptions = showAllTierPrices
    ? [...tierPriceOptions].reverse()
    : tierPriceOptions.slice(0, 4).reverse();
  const shouldAutoPollActivations = activations.some(
    (item) => item.activationStatus === "3" || item.activationStatus === "4",
  );
  const cancellableActivationsCount = activations.filter(canCancelActivation).length;

  function applyOfferOperators(nextOffer: HeroSmsOfferView | null, preferredOperator = "") {
    const nextOperators =
      nextOffer?.operators
        .filter((item) => item.code !== "any")
        .map((item) => ({
          code: item.code,
          name: item.name,
        })) ?? [];

    setOperators(nextOperators);
    setSelectedOperator((current) => {
      const hasOperator = (code: string) => nextOperators.some((item) => item.code === code);

      if (preferredOperator && hasOperator(preferredOperator)) {
        return preferredOperator;
      }

      return current && hasOperator(current) ? current : "";
    });
  }

  async function loadOffer(service: string, country: string, preferredOperator = "") {
    if (!service || !country) {
      setOffer(null);
      applyOfferOperators(null);
      setOfferError("");
      return;
    }

    setIsLoadingOffer(true);
    setOfferError("");
    setOperatorError("");

    try {
      const response = await fetch(
        `/api/hero-sms/offers?service=${encodeURIComponent(service)}&country=${encodeURIComponent(country)}`,
      );
      const result = (await response.json()) as OfferResponse & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "查询报价失败");
      }

      const nextOffer = result.offer ?? null;
      setOffer(nextOffer);
      applyOfferOperators(nextOffer, preferredOperator);
    } catch (error) {
      setOffer(null);
      applyOfferOperators(null);
      setOfferError(error instanceof Error ? error.message : "查询报价失败");
    } finally {
      setIsLoadingOffer(false);
    }
  }

  function applyOfferPrice(selection: PurchasePriceSelection, value: string) {
    setPurchasePrice(value);
    setPurchasePriceSelection(selection);
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
        (favorites[0]
          ? optionsResult.services.find((item) => item.code === favorites[0].serviceCode)?.code ??
            ""
          : "");
      const nextCountry = selectedCountry
        ? optionsResult.countries.find((item) => String(item.id) === selectedCountry)?.id
        : favorites[0]
          ? optionsResult.countries.find((item) => item.id === favorites[0].countryId)?.id
          : undefined;
      const nextOperator =
        selectedOperator ||
        (favorites[0] ? favorites[0].operatorCode : "");

      setSelectedService(nextService);
      setSelectedCountry(nextCountry ? String(nextCountry) : "");
      setSelectedOperator(nextOperator);
      setServiceKeyword("");
      setCountryKeyword("");

      await loadOffer(nextService, nextCountry ? String(nextCountry) : "", nextOperator);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "刷新失败");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function fetchActivationsList() {
    const response = await fetch("/api/hero-sms/activations");
    const result = (await response.json()) as ActivationsResponse & { error?: string };

    if (!response.ok) {
      throw new Error(result.error ?? "查询活动列表失败");
    }

    setActivations(result.items);
  }

  async function refreshActivations() {
    if (isPollingActivations) {
      return;
    }

    setIsPollingActivations(true);

    try {
      await fetchActivationsList();
    } catch {
      // 自动轮询只做静默同步，避免每 3 秒刷新时打扰当前操作日志。
    } finally {
      setIsPollingActivations(false);
    }
  }

  async function refreshBalanceOnly() {
    try {
      const response = await fetch("/api/hero-sms/balance");
      const result = (await response.json()) as BalanceResponse & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "刷新余额失败");
      }

      setBalance(result.balance);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "刷新余额失败");
    }
  }

  async function handleSaveFavorite() {
    if (isSavingFavorite) {
      return;
    }

    if (!selectedServiceOption) {
      setPurchaseError("请先选择服务。");
      return;
    }

    if (!selectedCountryOption) {
      setPurchaseError("请先选择国家。");
      return;
    }

    setIsSavingFavorite(true);
    setPurchaseError("");

    try {
      const response = await fetch("/api/hero-sms/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceCode: selectedServiceOption.code,
          serviceName: selectedServiceOption.name,
          countryId: selectedCountryOption.id,
          countryName: selectedCountryOption.name,
          operatorCode: selectedOperator,
        }),
      });
      const result = (await response.json()) as FavoritesResponse & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "收藏失败");
      }

      setFavorites(result.items);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "收藏失败");
    } finally {
      setIsSavingFavorite(false);
    }
  }

  async function handleDeleteFavorite(id: string) {
    if (isDeletingFavoriteId) {
      return;
    }

    setIsDeletingFavoriteId(id);
    setPurchaseError("");

    try {
      const response = await fetch("/api/hero-sms/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const result = (await response.json()) as FavoritesResponse & { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "删除收藏失败");
      }

      setFavorites(result.items);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "删除收藏失败");
    } finally {
      setIsDeletingFavoriteId("");
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
    setPurchaseLogs([]);
    setAutoRetryAttempt(0);
    setAutoRetryCountdown(0);
    setIsStoppingRetry(false);
    stopRetryRef.current = false;

    try {
      const requestBody = {
        service: selectedService,
        serviceName: selectedServiceOption?.name ?? selectedService,
        country: Number(selectedCountry),
        countryName: selectedCountryOption?.name ?? `国家 ${selectedCountry}`,
        maxPrice: normalizedPrice,
        operator: selectedOperator,
      };

      for (let attempt = 1; attempt <= HERO_SMS_AUTO_RETRY_MAX_ATTEMPTS; attempt += 1) {
        if (stopRetryRef.current) {
          throw new Error("已手动停止自动重试。");
        }

        setAutoRetryAttempt(attempt);

        const response = await fetch("/api/hero-sms/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...requestBody,
            notifyOnSuccess: attempt > 1,
            retryAttempt: attempt,
          }),
        });
        const result = (await response.json()) as PurchaseResponse;

        if (response.ok) {
          setPurchaseLogs((current) => [...current, `第 ${attempt} 次尝试购买成功。`]);
          await Promise.all([fetchActivationsList(), refreshBalanceOnly()]);
          setAutoRetryCountdown(0);
          return;
        }

        if (result.purchaseError?.code === "NO_NUMBERS") {
          if (attempt >= HERO_SMS_AUTO_RETRY_MAX_ATTEMPTS) {
            throw new Error(
              `已自动重试 ${HERO_SMS_AUTO_RETRY_MAX_ATTEMPTS} 次，仍然没有可售号码，请稍后再试。`,
            );
          }

          setPurchaseLogs((current) => [
            ...current,
            `已开启自动重试，当前重试第 ${attempt} 次，${HERO_SMS_AUTO_RETRY_INTERVAL_SECONDS} 秒后开启下次重试。`,
          ]);

          for (
            let seconds = HERO_SMS_AUTO_RETRY_INTERVAL_SECONDS;
            seconds > 0;
            seconds -= 1
          ) {
            if (stopRetryRef.current) {
              throw new Error("已手动停止自动重试。");
            }

            setAutoRetryCountdown(seconds);
            await new Promise((resolve) => {
              window.setTimeout(resolve, 1000);
            });
          }

          setAutoRetryCountdown(0);
          await loadOffer(selectedService, selectedCountry, selectedOperator);
          continue;
        }

        throw new Error(result.error ?? "购买失败");
      }

    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "购买失败");
    } finally {
      setIsPurchasing(false);
      setAutoRetryCountdown(0);
      setIsStoppingRetry(false);
      stopRetryRef.current = false;
    }
  }

  function handleStopRetry() {
    if (!isPurchasing || isStoppingRetry) {
      return;
    }

    setIsStoppingRetry(true);
    stopRetryRef.current = true;
    setPurchaseLogs((current) => [
      ...current,
      "已请求停止自动重试，当前等待中的重试将在本轮结束后停止。",
    ]);
  }

  useEffect(() => {
    void loadOffer(selectedService, selectedCountry);
    setShowAllTierPrices(false);
  }, [selectedService, selectedCountry]);

  useEffect(() => {
    if (!offer) {
      return;
    }

    if (purchasePriceSelection === "manual") {
      return;
    }

    if (purchasePriceSelection === "personal-min" && hasSelectedOperatorPersonalMin) {
      setPurchasePrice(offer.minPrice);
      setPurchasePriceSelection("personal-min");
      return;
    }

    const selectedTier = operatorTierPrices.find(
      (item) => `tier:${item.price}` === purchasePriceSelection,
    );

    if (selectedTier) {
      setPurchasePrice(selectedTier.price);
      return;
    }

    if (hasSelectedOperatorPersonalMin) {
      setPurchasePrice(offer.minPrice);
      setPurchasePriceSelection("personal-min");
      return;
    }

    const firstTier = operatorTierPrices[0];

    if (firstTier) {
      setPurchasePrice(firstTier.price);
      setPurchasePriceSelection(`tier:${firstTier.price}`);
      return;
    }

    setPurchasePrice(offer.minPrice);
    setPurchasePriceSelection("manual");
  }, [
    hasSelectedOperatorPersonalMin,
    offer,
    operatorTierPrices,
    purchasePriceSelection,
    selectedOperator,
  ]);

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (!shouldAutoPollActivations) {
        return;
      }

      if (isPollingActivations || actioningActivationId || isRefreshing || isBatchCancelling) {
        return;
      }

      void refreshActivations();
    }, HERO_SMS_ACTIVATIONS_AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    actioningActivationId,
    isBatchCancelling,
    isPollingActivations,
    isRefreshing,
    shouldAutoPollActivations,
  ]);

  function getActivationRemainingMs(item: HeroSmsActivationView): number | null {
    const activationStart = new Date(item.activationTime).getTime();
    const activationEnd = new Date(item.activationEndTime).getTime();
    const localCreatedAt = new Date(item.createdAt).getTime();

    if (
      Number.isNaN(activationStart) ||
      Number.isNaN(activationEnd) ||
      Number.isNaN(localCreatedAt) ||
      activationEnd <= activationStart
    ) {
      return null;
    }

    const durationMs = activationEnd - activationStart;
    const localDeadline = localCreatedAt + durationMs;

    return Math.max(localDeadline - countdownNow, 0);
  }

  function getActivationRemark(item: HeroSmsActivationView): string {
    if (hasHeroSmsActivationReceivedSms(item)) {
      return "已返回短信内容不可取消";
    }

    const cancelLockRemainingMs = getHeroSmsCancelLockRemainingMs(item, countdownNow);

    if (cancelLockRemainingMs === null) {
      return "取消时间待确认";
    }

    if (cancelLockRemainingMs > 0) {
      return `2 分钟之内不可取消，剩余 ${formatCountdown(cancelLockRemainingMs)}`;
    }

    return "可取消";
  }

  function canCancelActivation(item: HeroSmsActivationView): boolean {
    return canCancelHeroSmsActivation(item, countdownNow);
  }

  async function handleActivationAction(item: HeroSmsActivationView, action: ActivationAction) {
    if (actioningActivationId) {
      return;
    }

    const confirmed = window.confirm(
      action === "cancel"
        ? "确认取消这条号码吗？"
        : action === "finish"
          ? "确认完成这条号码吗？"
          : "确认开始等待下一条短信吗？",
    );

    if (!confirmed) {
      return;
    }

    setActioningActivationId(item.id);
    setPurchaseError("");

    try {
      const response = await fetch(`/api/hero-sms/activations/${item.id}/action`, {
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

      await Promise.all([fetchActivationsList(), refreshBalanceOnly()]);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setActioningActivationId("");
    }
  }

  async function handleBatchCancelActivations() {
    if (isBatchCancelling || actioningActivationId) {
      return;
    }

    const cancellableItems = activations.filter(canCancelActivation);

    if (cancellableItems.length === 0) {
      setPurchaseError("当前没有符合条件的可取消号码。");
      return;
    }

    const confirmed = window.confirm(`确认批量取消 ${cancellableItems.length} 条可取消号码吗？`);

    if (!confirmed) {
      return;
    }

    setIsBatchCancelling(true);
    setPurchaseError("");
    setPurchaseLogs((current) => [
      ...current,
      `开始批量取消 ${cancellableItems.length} 条可取消号码。`,
    ]);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (const item of cancellableItems) {
        const response = await fetch(`/api/hero-sms/activations/${item.id}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "cancel" }),
        });
        const result = (await response.json()) as { error?: string };

        if (response.ok) {
          successCount += 1;
          continue;
        }

        failedCount += 1;
        setPurchaseLogs((current) => [
          ...current,
          `${item.phoneNumber} 取消失败：${result.error ?? "操作失败"}`,
        ]);
      }

      setPurchaseLogs((current) => [
        ...current,
        `批量取消完成：成功 ${successCount} 条，失败 ${failedCount} 条。`,
      ]);
      await Promise.all([fetchActivationsList(), refreshBalanceOnly()]);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "批量取消失败");
    } finally {
      setIsBatchCancelling(false);
    }
  }

  async function applyFavorite(item: HeroSmsFavoriteView) {
    setSelectedService(item.serviceCode);
    setSelectedCountry(String(item.countryId));
    setSelectedOperator(item.operatorCode);
    setServiceKeyword("");
    setCountryKeyword("");
    setIsServicePickerOpen(false);
    setIsCountryPickerOpen(false);
  }

  useEffect(() => {
    if (selectedService || selectedCountry || selectedOperator) {
      return;
    }

    const firstFavorite = favorites[0];

    if (!firstFavorite) {
      return;
    }

    void applyFavorite(firstFavorite);
  }, [favorites, selectedCountry, selectedOperator, selectedService]);

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)] px-6 py-4 shadow-[var(--shadow)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold">短信接码</h1>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xl font-semibold">
                {formattedBalance} + {formattedCost} = {formattedTotalSpend}
              </p>
              <a
                href="/dashboard"
                className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm"
              >
                返回邮箱管理
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">收藏</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                常用的服务、国家、运营商组合会显示在这里。
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {favorites.length > 0 ? (
                favorites.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm"
                  >
                    <button
                      type="button"
                      className="transition hover:text-[var(--primary)]"
                      onClick={() => {
                        void applyFavorite(favorite);
                      }}
                    >
                      {favorite.serviceName} / {favorite.countryName} /{" "}
                      {favorite.operatorCode || "任意运营商"}
                    </button>
                    <button
                      type="button"
                      className="text-[var(--muted)] transition hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => {
                        void handleDeleteFavorite(favorite.id);
                      }}
                      disabled={isDeletingFavoriteId === favorite.id}
                      aria-label="删除收藏"
                      title="删除收藏"
                    >
                      {isDeletingFavoriteId === favorite.id ? "…" : "×"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">当前还没有收藏组合。</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
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
                  <span className="inline-flex w-7 justify-center text-2xl leading-none text-[var(--muted)]">
                    ⌕
                  </span>
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
              <div className="relative">
                <select
                  value={selectedOperator}
                  onChange={(event) => setSelectedOperator(event.target.value)}
                  className="w-full appearance-none rounded-2xl border border-[var(--border)] bg-white px-4 py-3 pr-12 text-base"
                >
                  <option value="">任意运营商</option>
                  {operators.map((operator) => (
                    <option key={operator.code} value={operator.code}>
                      {operator.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 inline-flex w-7 -translate-y-1/2 justify-center text-2xl leading-none text-[var(--muted)]">
                  ⌄
                </span>
              </div>
            </label>
            <div className="grid items-end">
              <button
                type="button"
                className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleSaveFavorite}
                disabled={isSavingFavorite}
              >
                {isSavingFavorite ? "收藏中..." : "收藏当前选择"}
              </button>
            </div>
          </div>

          {!isLoadingOffer && !offerError && !offer ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white px-5 py-8 text-sm text-[var(--muted)]">
              当前组合暂无报价或暂不可售。
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 xl:h-[360px] xl:grid-cols-[minmax(220px,0.75fr)_minmax(0,0.45fr)_minmax(480px,1.35fr)]">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] px-5 py-5">
              {offer ? (
                <div className="flex h-full min-h-[280px] flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                      阶梯价格
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {tierPriceOptions.length} 档
                    </p>
                  </div>
                  <div className="mt-4 max-h-[260px] overflow-y-auto pr-1">
                    <div className="flex flex-col gap-1.5">
                      {visibleTierPriceOptions.map((item) => (
                        <label
                          key={item.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${
                            purchasePriceSelection === item.id
                              ? "border-[var(--primary)] bg-white"
                              : "border-transparent bg-transparent hover:bg-white/70"
                          }`}
                        >
                          <input
                            type="radio"
                            name="hero-sms-purchase-price"
                            checked={purchasePriceSelection === item.id}
                            onChange={() => applyOfferPrice(item.id, item.label)}
                          />
                          <span className="font-semibold leading-none">{item.label}</span>
                          <span className="ml-auto text-xs text-[var(--muted)]">
                            库存 {formatCompactCount(item.count)}
                          </span>
                        </label>
                      ))}
                    </div>
                    {tierPriceOptions.length > 6 ? (
                      <button
                        type="button"
                        className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)] transition hover:bg-white"
                        onClick={() => setShowAllTierPrices((current) => !current)}
                      >
                        {showAllTierPrices
                          ? "收起价格"
                          : `展开更多价格（${tierPriceOptions.length - 4}）`}
                      </button>
                    ) : null}
                  </div>
                  {hasSelectedOperatorPersonalMin ? (
                    <div className="mt-auto border-t border-[var(--border)] pt-3">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                          purchasePriceSelection === "personal-min"
                            ? "border-[var(--primary)] bg-white"
                            : "border-transparent bg-transparent hover:bg-white/70"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hero-sms-purchase-price"
                          checked={purchasePriceSelection === "personal-min"}
                          onChange={() => applyOfferPrice("personal-min", offer.minPrice)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-xl font-semibold text-[var(--primary)]">
                            {offer.minPrice}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--muted)]">
                            个人最低价
                          </span>
                        </span>
                      </label>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="min-w-0 flex flex-col justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-white px-5 py-5">
              <button
                type="button"
                className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
                onClick={refreshAll}
                disabled={isRefreshing}
              >
                {isRefreshing ? "刷新中..." : "手动刷新"}
              </button>
              <label className="grid gap-2 text-sm">
                <span className="text-[var(--muted)]">购置价格</span>
                <input
                  value={purchasePrice}
                  onChange={(event) => {
                    setPurchasePrice(event.target.value);
                    setPurchasePriceSelection("manual");
                  }}
                  placeholder={offer ? `例如 ${offer.minPrice}` : "请输入你希望的最高购置价格"}
                  className="w-full min-w-0 rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  type="button"
                  className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? "购买中..." : "购买 1 条号码"}
                </button>
                {isPurchasing ? (
                  <button
                    type="button"
                    className="rounded-2xl border border-[var(--danger)] px-5 py-3 text-sm font-semibold text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={handleStopRetry}
                    disabled={isStoppingRetry}
                  >
                    {isStoppingRetry ? "停止中..." : "停止重试"}
                  </button>
                ) : null}
              </div>

            </div>

            <aside className="flex min-h-[280px] flex-col rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 xl:min-h-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text)]">日志</p>
                {isPurchasing && autoRetryAttempt > 0 ? (
                  <p className="text-xs text-[var(--muted)] text-right">
                    当前第 {autoRetryAttempt} 次尝试
                    {autoRetryCountdown > 0 ? `，${autoRetryCountdown} 秒后继续` : ""}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 text-sm text-[var(--muted)]">
                {errorLogs.length > 0 || purchaseLogs.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {errorLogs.map((log, index) => (
                      <p key={`error-${index}-${log}`} className="text-[var(--danger)]">
                        {log}
                      </p>
                    ))}
                    {purchaseLogs.map((log, index) => (
                      <p key={`${index}-${log}`}>{log}</p>
                    ))}
                  </div>
                ) : (
                  <p>这里会显示自动购买的重试过程和结果。</p>
                )}
              </div>
            </aside>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">活动列表</p>
              <h2 className="mt-2 text-2xl font-semibold">当前活动中的号码</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleBatchCancelActivations()}
                disabled={isBatchCancelling || cancellableActivationsCount === 0}
              >
                {isBatchCancelling
                  ? "批量取消中..."
                  : `批量取消可取消号码（${cancellableActivationsCount}）`}
              </button>
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={showDigitsOnly}
                  onChange={(event) => setShowDigitsOnly(event.target.checked)}
                />
                只显示数字
              </label>
            </div>
          </div>

          {activations.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[var(--border)] bg-white px-5 py-8 text-sm text-[var(--muted)]">
              当前还没有活动中的 HeroSMS 号码。
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-[24px] border border-[var(--border)] bg-white">
              <table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
                <thead className="bg-[var(--panel-strong)] text-left text-[var(--muted)]">
                  <tr>
                    <th className="w-[14%] px-4 py-3 font-medium">号码</th>
                    <th className="w-[10%] px-4 py-3 font-medium">实际价格</th>
                    <th className="w-[11%] px-4 py-3 font-medium">剩余时间</th>
                    <th className="w-[12%] px-4 py-3 font-medium">当前状态</th>
                    <th className="w-[9%] px-4 py-3 font-medium">运营商</th>
                    <th className="w-[13%] px-4 py-3 font-medium">备注</th>
                    <th className="w-[18%] px-4 py-3 font-medium">最新短信</th>
                    <th className="w-[13%] px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {activations.map((item) => {
                    const remaining = getActivationRemainingMs(item);
                    const hasVisibleSms = Boolean(item.smsText);
                    const hasEverReceivedSms = hasHeroSmsActivationReceivedSms(item);
                    const canCancel = canCancelActivation(item);
                    const remark = getActivationRemark(item);
                    const primaryAction: ActivationAction = hasEverReceivedSms
                      ? "finish"
                      : "cancel";
                    const canRetrySms =
                      item.activationStatus === "2" &&
                      hasVisibleSms &&
                      item.canGetAnotherSms;
                    const smsDisplayText = getHeroSmsActivationSmsDisplay({
                      smsCode: item.smsCode,
                      smsText: item.smsText,
                      showDigitsOnly,
                    });

                    return (
                      <tr key={item.id} className="h-14 border-t border-[var(--border)]">
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle">
                          <button
                            type="button"
                            className="block max-w-full cursor-pointer truncate text-left font-semibold transition hover:opacity-75"
                            onClick={() => copyText(item.phoneNumber, `activation-phone-${item.id}`)}
                            title="点击复制号码"
                          >
                            {item.phoneNumber}
                          </button>
                        </td>
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle font-medium">
                          {item.activationCost} {item.currencyLabel}
                        </td>
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle">
                          <p className="font-medium tabular-nums">
                            {remaining === null ? "待确认" : formatCountdown(remaining)}
                          </p>
                        </td>
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle">
                          <p className="font-medium">{item.activationStatusText}</p>
                        </td>
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle font-medium">
                          {item.operatorCode || "任意运营商"}
                        </td>
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle">
                          <span
                            className={
                              canCancel
                                ? "font-medium text-[var(--primary)]"
                                : "text-[var(--muted)]"
                            }
                          >
                            {remark}
                          </span>
                        </td>
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle">
                          {smsDisplayText ? (
                            <>
                              <button
                                type="button"
                                className="block max-w-full cursor-pointer truncate text-left transition hover:opacity-75"
                                onClick={() =>
                                  copyText(smsDisplayText, `activation-sms-${item.id}`)
                                }
                                title="点击复制短信"
                              >
                                {smsDisplayText}
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-[var(--muted)]">
                                {item.activationStatus === "3"
                                  ? "等待再次接收短信"
                                  : "等待接收短信"}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="border-t border-[var(--border)] px-4 py-2 align-middle">
                          <div className="flex min-h-8 items-center gap-2 whitespace-nowrap">
                            {canRetrySms ? (
                              <button
                                type="button"
                                className="h-8 rounded-xl border border-[var(--border)] px-3 text-xs font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={() => void handleActivationAction(item, "retry-sms")}
                                disabled={actioningActivationId === item.id || isBatchCancelling}
                              >
                                {actioningActivationId === item.id ? "处理中..." : "再次接收"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="h-8 rounded-xl border border-[var(--border)] px-3 text-xs font-medium transition hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-70"
                              onClick={() => void handleActivationAction(item, primaryAction)}
                              disabled={
                                actioningActivationId === item.id ||
                                isBatchCancelling ||
                                (primaryAction === "cancel" && !canCancel)
                              }
                              title={primaryAction === "cancel" && !canCancel ? remark : undefined}
                            >
                              {actioningActivationId === item.id
                                ? "处理中..."
                                : primaryAction === "cancel"
                                  ? "取消"
                                  : "完成"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
