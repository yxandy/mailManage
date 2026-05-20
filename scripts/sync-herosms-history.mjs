#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERO_SMS_COMPAT_BASE_URL = "https://hero-sms.com/stubs/handler_api.php";
const WINDOW_DAYS = 14;
const PAGE_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadLocalEnv() {
  const envFilePath = path.join(projectRoot, ".env.local");

  if (!existsSync(envFilePath)) {
    return;
  }

  const lines = readFileSync(envFilePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const result = {
    dryRun: true,
    onlySuccessful: true,
  };

  for (const arg of argv) {
    if (arg === "--write") {
      result.dryRun = false;
      continue;
    }

    if (arg === "--include-all") {
      result.onlySuccessful = false;
      continue;
    }

    const [key, value] = arg.split("=");

    if (key === "--from") {
      result.from = value;
    } else if (key === "--to") {
      result.to = value;
    } else if (key === "--max-windows") {
      result.maxWindows = Number(value);
    }
  }

  return result;
}

function requireEnv(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`缺少环境变量：${key}`);
  }

  return value;
}

function parseDate(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`日期格式无效：${value}`);
  }

  return parsed;
}

function toUnixSeconds(date) {
  return Math.floor(date.getTime() / 1000);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getStringValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    const normalized = String(value).trim();

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function getNumberValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    const normalized = Number(value);

    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return null;
}

function normalizeHistoryItem(item) {
  const activationId = getStringValue(item.id, item.activationId);
  const phoneNumber = getStringValue(item.phone, item.phoneNumber);

  if (!activationId || !phoneNumber) {
    return null;
  }

  return {
    activation_id: activationId,
    activation_date: getStringValue(item.date),
    phone_number: phoneNumber,
    activation_cost: getStringValue(item.cost, item.activationCost),
    currency_code: getNumberValue(item.currency),
    service_code: getStringValue(item.serviceCode, item.service),
    service_name: getStringValue(item.serviceName),
    country_id: getNumberValue(item.countryCode, item.country),
    country_name: getStringValue(item.countryName),
    operator_code: getStringValue(item.activationOperator, item.operator),
    activation_status: getStringValue(item.status, item.activationStatus),
    sms_text: getStringValue(item.sms, item.smsText),
    raw_payload: item,
    synced_at: new Date().toISOString(),
  };
}

function isSuccessfulHistoryItem(item) {
  const status = item.activation_status?.trim().toLowerCase() ?? "";

  return status === "6" || status === "success" || Boolean(item.sms_text);
}

async function fetchHeroSmsHistoryWindow({ apiKey, start, end }) {
  let items = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const params = new URLSearchParams({
      api_key: apiKey,
      action: "getHistory",
      start: String(toUnixSeconds(start)),
      end: String(toUnixSeconds(end)),
      offset: String(offset),
      limit: String(PAGE_SIZE),
    });
    const response = await fetch(`${HERO_SMS_COMPAT_BASE_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });
    const text = (await response.text()).trim();

    if (!response.ok) {
      throw new Error(`HeroSMS 历史接口失败：${response.status} ${text}`);
    }

    let pageItems;

    try {
      pageItems = JSON.parse(text);
    } catch {
      throw new Error(`HeroSMS 历史接口返回无法解析：${text}`);
    }

    if (!Array.isArray(pageItems)) {
      throw new Error(`HeroSMS 历史接口返回异常：${text}`);
    }

    items = pageItems;

    if (pageItems.length < offset + PAGE_SIZE) {
      break;
    }
  }

  return items;
}

function buildWindows(from, to, maxWindows) {
  const windows = [];
  let windowEnd = new Date(to.getTime());

  while (windowEnd > from) {
    const windowStart = new Date(Math.max(from.getTime(), windowEnd.getTime() - WINDOW_DAYS * DAY_MS));
    windows.push({ start: windowStart, end: windowEnd });
    windowEnd = windowStart;

    if (maxWindows && windows.length >= maxWindows) {
      break;
    }
  }

  return windows;
}

async function main() {
  loadLocalEnv();

  const args = parseArgs(process.argv.slice(2));
  const apiKey = requireEnv("HERO_SMS_API_KEY");
  const to = parseDate(args.to, new Date());
  const from = parseDate(args.from, new Date(to.getTime() - WINDOW_DAYS * DAY_MS));
  const windows = buildWindows(from, to, args.maxWindows);
  const supabase = args.dryRun
    ? null
    : createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

  console.log(
    `HeroSMS 历史同步：${formatDate(from)} 到 ${formatDate(to)}，窗口 ${windows.length} 个，模式 ${
      args.dryRun ? "dry-run" : "write"
    }。`,
  );

  let totalRaw = 0;
  let totalNormalized = 0;
  let totalSuccessful = 0;
  let totalWritten = 0;

  for (const window of windows) {
    const rawItems = await fetchHeroSmsHistoryWindow({
      apiKey,
      start: window.start,
      end: window.end,
    });
    const normalizedItems = rawItems
      .map(normalizeHistoryItem)
      .filter((item) => item !== null);
    const selectedItems = args.onlySuccessful
      ? normalizedItems.filter(isSuccessfulHistoryItem)
      : normalizedItems;

    totalRaw += rawItems.length;
    totalNormalized += normalizedItems.length;
    totalSuccessful += selectedItems.length;

    console.log(
      `${formatDate(window.start)} ~ ${formatDate(window.end)}：原始 ${rawItems.length}，可入库 ${
        selectedItems.length
      }。`,
    );

    if (supabase && selectedItems.length > 0) {
      const { error } = await supabase
        .from("hero_sms_activation_history")
        .upsert(selectedItems, { onConflict: "activation_id" });

      if (error) {
        throw new Error(`写入 HeroSMS 历史失败：${error.message}`);
      }

      totalWritten += selectedItems.length;
    }
  }

  console.log(
    `同步完成：原始 ${totalRaw}，字段有效 ${totalNormalized}，选中 ${totalSuccessful}，写入 ${totalWritten}。`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
