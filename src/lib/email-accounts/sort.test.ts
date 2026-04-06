import test from "node:test";
import assert from "node:assert/strict";

import { getEmailAccountOrderRules } from "./sort.ts";

test("邮箱账号列表排序规则符合业务要求", () => {
  assert.deepEqual(getEmailAccountOrderRules(), [
    {
      column: "is_linked_s2a",
      options: { ascending: true, nullsFirst: false },
    },
    {
      column: "registered_at",
      options: { ascending: true, nullsFirst: false },
    },
    {
      column: "created_at",
      options: { ascending: true, nullsFirst: false },
    },
  ]);
});
