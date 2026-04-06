import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = {
  username: string;
  expiresAt: string;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function encodeSessionToken(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function decodeSessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload> {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    throw new Error("会话令牌格式不正确");
  }

  const expectedSignature = sign(encodedPayload, secret);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error("会话令牌签名无效");
  }

  return JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
}
