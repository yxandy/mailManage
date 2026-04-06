import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword } from "./password.ts";

test("同一密码生成的哈希不应等于明文，且可以通过校验", async () => {
  const plainText = "Admin123456";
  const passwordHash = await hashPassword(plainText);

  assert.notEqual(passwordHash, plainText);
  assert.equal(await verifyPassword(plainText, passwordHash), true);
});

test("错误密码不能通过哈希校验", async () => {
  const passwordHash = await hashPassword("Admin123456");

  assert.equal(await verifyPassword("Wrong123456", passwordHash), false);
});
