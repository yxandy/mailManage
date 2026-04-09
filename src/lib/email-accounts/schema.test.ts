import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEmailAccountInput, splitEmailName } from "./schema.ts";

test("账号名称和预设域名会合并成 email_name", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_linked_s2a: false,
    linked_at: "",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.email_name, "test@gmail.com");
});

test("注册时间和关联时间按纯日期保存，避免时区偏移", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "2026-04-06",
    registered_location: "",
    is_linked_s2a: true,
    linked_at: "2026-04-07",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.registered_at, "2026-04-06T00:00:00.000Z");
  assert.equal(result.linked_at, "2026-04-07T00:00:00.000Z");
});

test("失效时间也按纯日期保存，避免时区偏移", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_linked_s2a: false,
    linked_at: "",
    is_expired: true,
    expired_at: "2026-04-08",
  });

  assert.equal(result.expired_at, "2026-04-08T00:00:00.000Z");
});

test("cg 注册时间按纯日期保存，避免时区偏移", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_registered_cg: true,
    cg_registered_at: "2026-04-09",
    is_linked_s2a: false,
    linked_at: "",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.cg_registered_at, "2026-04-09T00:00:00.000Z");
});

test("选择自定义域名时会合并自定义域名", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "custom",
    custom_email_domain: "example.com",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_linked_s2a: false,
    linked_at: "",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.email_name, "test@example.com");
});

test("除邮箱账号名称外的其他字段都允许为空", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_linked_s2a: false,
    linked_at: "",
    is_expired: false,
    expired_at: "",
  });

  assert.deepEqual(
    {
      user_name: result.user_name,
      birthday: result.birthday,
      registered_at: result.registered_at,
      registered_location: result.registered_location,
      cg_registered_at: result.cg_registered_at,
      linked_at: result.linked_at,
      expired_at: result.expired_at,
    },
    {
      user_name: null,
      birthday: null,
      registered_at: null,
      registered_location: null,
      cg_registered_at: null,
      linked_at: null,
      expired_at: null,
    },
  );
});

test("已有 email_name 可以拆分为账号和域名", () => {
  const result = splitEmailName("hello@example.com");

  assert.deepEqual(result, {
    emailAccountName: "hello",
    emailDomain: "custom",
    customEmailDomain: "example.com",
  });
});

test("未关联 s2a 时会清空关联时间", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_linked_s2a: false,
    linked_at: "2026-04-06",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.linked_at, null);
});

test("未注册 cg 时会清空 cg 注册时间", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_registered_cg: false,
    cg_registered_at: "2026-04-09",
    is_linked_s2a: false,
    linked_at: "",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.cg_registered_at, null);
});

test("未失效时会清空失效时间", () => {
  const result = normalizeEmailAccountInput({
    email_account_name: "test",
    email_domain: "gmail.com",
    custom_email_domain: "",
    user_name: "",
    birthday: "",
    registered_at: "",
    registered_location: "",
    is_linked_s2a: true,
    linked_at: "",
    is_expired: false,
    expired_at: "2026-04-07",
  });

  assert.equal(result.expired_at, null);
});

test("缺少邮箱账号名称时抛出错误", () => {
  assert.throws(() =>
    normalizeEmailAccountInput({
      email_account_name: "",
      email_domain: "gmail.com",
      custom_email_domain: "",
      user_name: "",
      birthday: "",
      registered_at: "",
      registered_location: "",
      is_linked_s2a: false,
      linked_at: "",
      is_expired: false,
      expired_at: "",
    }),
  );
});
