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
