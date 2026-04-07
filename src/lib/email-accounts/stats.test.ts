import test from "node:test";
import assert from "node:assert/strict";

import { calculateEmailAccountStats } from "./stats.ts";

test("邮箱统计卡片数据按业务规则计算", () => {
  const result = calculateEmailAccountStats([
    {
      id: "1",
      email_name: "a@gmail.com",
      user_name: null,
      birthday: null,
      registered_at: null,
      registered_location: null,
      is_linked_s2a: false,
      linked_at: null,
      is_expired: false,
      expired_at: null,
      deleted_at: null,
      created_at: "2026-04-01T00:00:00.000Z",
      updated_at: "2026-04-01T00:00:00.000Z",
    },
    {
      id: "2",
      email_name: "b@gmail.com",
      user_name: null,
      birthday: null,
      registered_at: null,
      registered_location: null,
      is_linked_s2a: true,
      linked_at: "2026-04-01T00:00:00.000Z",
      is_expired: true,
      expired_at: "2026-04-06T00:00:00.000Z",
      deleted_at: null,
      created_at: "2026-04-01T00:00:00.000Z",
      updated_at: "2026-04-01T00:00:00.000Z",
    },
    {
      id: "3",
      email_name: "c@gmail.com",
      user_name: null,
      birthday: null,
      registered_at: null,
      registered_location: null,
      is_linked_s2a: true,
      linked_at: "2026-04-01T00:00:00.000Z",
      is_expired: true,
      expired_at: "2026-04-04T12:00:00.000Z",
      deleted_at: null,
      created_at: "2026-04-01T00:00:00.000Z",
      updated_at: "2026-04-01T00:00:00.000Z",
    },
  ]);

  assert.deepEqual(result, {
    unlinkedCount: 1,
    linkedCount: 2,
    expiredPercentage: 66.7,
    averageLinkedLifetimeDays: 4.3,
  });
});

test("没有有效存活样本时平均存活时长返回空", () => {
  const result = calculateEmailAccountStats([]);

  assert.deepEqual(result, {
    unlinkedCount: 0,
    linkedCount: 0,
    expiredPercentage: 0,
    averageLinkedLifetimeDays: null,
  });
});
