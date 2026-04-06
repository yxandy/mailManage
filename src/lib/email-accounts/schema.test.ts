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
      linked_at: result.linked_at,
      expired_at: result.expired_at,
    },
    {
      user_name: null,
      birthday: null,
      registered_at: null,
      registered_location: null,
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
    linked_at: "2026-04-06T12:00",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.linked_at, null);
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
    expired_at: "2026-04-07T12:00",
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
