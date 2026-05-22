import { createHash } from "node:crypto";

function createShortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function buildSmsBowerReceivedDedupeKey(input: {
  activationId: string;
  smsCode: string;
  smsText: string;
}): string {
  const smsIdentity = input.smsCode || createShortHash(input.smsText);

  return `sms-bower:sms-received:${input.activationId}:${smsIdentity}`;
}
