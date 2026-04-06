import test from "node:test";
import assert from "node:assert/strict";

import { decodeSessionToken, encodeSessionToken } from "./session.ts";

test("合法会话可以编码并解码", async () => {
  const secret = "session-secret-for-test";
  const token = await encodeSessionToken(
    {
      username: "admin",
      expiresAt: new Date("2026-04-07T00:00:00.000Z").toISOString(),
    },
    secret,
  );

  const payload = await decodeSessionToken(token, secret);

  assert.deepEqual(payload, {
    username: "admin",
    expiresAt: "2026-04-07T00:00:00.000Z",
  });
});

test("被篡改的会话令牌不能通过解码", async () => {
  const secret = "session-secret-for-test";
  const token = await encodeSessionToken(
    {
      username: "admin",
      expiresAt: new Date("2026-04-07T00:00:00.000Z").toISOString(),
    },
    secret,
  );

  const tamperedToken = `${token}tampered`;

  await assert.rejects(() => decodeSessionToken(tamperedToken, secret));
});
