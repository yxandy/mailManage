import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaFilePath = path.resolve(__dirname, "../../../supabase/schema.sql");

test("email_accounts 表包含 source 来源字段", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.email_accounts[\s\S]*\n\s*source\s+text,?/i,
  );
});

test("email_accounts 表包含 is_plus 字段", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.email_accounts[\s\S]*\n\s*is_plus\s+boolean\s+not null\s+default false,?/i,
  );
});

test("system_settings 表包含 cny_price 字段", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.system_settings[\s\S]*\n\s*cny_price\s+numeric\(10,2\)\s+not null\s+default 34\.34,?/i,
  );
});

test("hero_sms_activations 表包含 activation_id 与活动状态字段", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activations[\s\S]*\n\s*activation_id\s+text\s+not null unique,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activations[\s\S]*\n\s*is_active\s+boolean\s+not null\s+default true,?/i,
  );
});

test("hero_sms_favorites 表包含收藏唯一约束字段", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_favorites[\s\S]*\n\s*service_code\s+text\s+not null,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_favorites[\s\S]*\n\s*operator_code\s+text,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_favorites[\s\S]*\n\s*deleted_at\s+timestamptz,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_favorites[\s\S]*constraint hero_sms_favorites_unique_selection unique \(service_code, country_id, operator_code\)/i,
  );
});

test("hero_sms_activation_history 表包含成功历史分析字段与原始载荷", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activation_history[\s\S]*\n\s*activation_id\s+text\s+not null unique,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activation_history[\s\S]*\n\s*phone_number\s+text\s+not null,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activation_history[\s\S]*\n\s*activation_cost\s+numeric\(12,4\),?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activation_history[\s\S]*\n\s*service_code\s+text,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activation_history[\s\S]*\n\s*country_id\s+integer,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activation_history[\s\S]*\n\s*operator_code\s+text,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_activation_history[\s\S]*\n\s*raw_payload\s+jsonb\s+not null\s+default '\{\}'::jsonb,?/i,
  );
  assert.match(
    schemaSql,
    /create index if not exists idx_hero_sms_activation_history_activation_date\s+on public\.hero_sms_activation_history \(activation_date desc\);/i,
  );
});

test("sms_bower_activations 表包含活动号码和短信字段", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.sms_bower_activations[\s\S]*\n\s*activation_id\s+text\s+not null unique,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.sms_bower_activations[\s\S]*\n\s*provider_ids\s+text\s+not null,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.sms_bower_activations[\s\S]*\n\s*sms_code\s+text,?/i,
  );
  assert.match(
    schemaSql,
    /create index if not exists idx_sms_bower_activations_is_active\s+on public\.sms_bower_activations \(is_active\);/i,
  );
});

test("notification_events 表包含提醒队列核心字段与唯一去重键", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.notification_events[\s\S]*\n\s*dedupe_key\s+text\s+not null unique,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.notification_events[\s\S]*\n\s*status\s+text\s+not null\s+default 'pending',?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.notification_events[\s\S]*\n\s*attempt_count\s+integer\s+not null\s+default 0,?/i,
  );
  assert.match(
    schemaSql,
    /create index if not exists idx_notification_events_pending\s+on public\.notification_events \(status, next_attempt_at, created_at\);/i,
  );
});

test("hero_sms_price_monitors 表包含价格库存监控字段与索引", () => {
  const schemaSql = readFileSync(schemaFilePath, "utf8");

  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_price_monitors[\s\S]*\n\s*service_code\s+text\s+not null,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_price_monitors[\s\S]*\n\s*operator_code\s+text\s+not null\s+default 'any',?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_price_monitors[\s\S]*\n\s*target_price\s+numeric\(12,4\)\s+not null,?/i,
  );
  assert.match(
    schemaSql,
    /create table if not exists public\.hero_sms_price_monitors[\s\S]*status in \('active', 'paused', 'triggered', 'deleted'\)/i,
  );
  assert.match(
    schemaSql,
    /create unique index if not exists idx_hero_sms_price_monitors_unique_live_target\s+on public\.hero_sms_price_monitors \(service_code, country_id, operator_code, target_price\)\s+where deleted_at is null;/i,
  );
  assert.match(
    schemaSql,
    /create index if not exists idx_hero_sms_price_monitors_status_checked_at\s+on public\.hero_sms_price_monitors \(status, last_checked_at\);/i,
  );
});
