import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEmailAccountInput } from "./schema.ts";

test("未关联 s2a 时会清空关联时间", () => {
  const result = normalizeEmailAccountInput({
    email_name: "test@gmail.com",
    user_name: "张三",
    birthday: "2000-01-01",
    registered_at: "2026-04-06T10:00",
    registered_location: "香港",
    is_linked_s2a: false,
    linked_at: "2026-04-06T12:00",
    is_expired: false,
    expired_at: "",
  });

  assert.equal(result.linked_at, null);
});

test("未失效时会清空失效时间", () => {
  const result = normalizeEmailAccountInput({
    email_name: "test@gmail.com",
    user_name: "张三",
    birthday: "2000-01-01",
    registered_at: "2026-04-06T10:00",
    registered_location: "香港",
    is_linked_s2a: true,
    linked_at: "2026-04-06T12:00",
    is_expired: false,
    expired_at: "2026-04-07T12:00",
  });

  assert.equal(result.expired_at, null);
});

test("缺少必填字段时抛出错误", () => {
  assert.throws(() =>
    normalizeEmailAccountInput({
      email_name: "",
      user_name: "张三",
      birthday: "",
      registered_at: "2026-04-06T10:00",
      registered_location: "香港",
      is_linked_s2a: false,
      linked_at: "",
      is_expired: false,
      expired_at: "",
    }),
  );
});
