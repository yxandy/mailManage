import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getRequiredEnv } from "@/lib/env";

import { decodeSessionToken, encodeSessionToken, type SessionPayload } from "./session";

export const SESSION_COOKIE_NAME = "email-admin-session";
const SESSION_DURATION_IN_DAYS = 7;

function getSessionExpiration(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_IN_DAYS);

  return expiresAt;
}

export async function createSessionToken(username: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const expiresAt = getSessionExpiration();
  const token = await encodeSessionToken(
    {
      username,
      expiresAt: expiresAt.toISOString(),
    },
    getRequiredEnv("SESSION_SECRET"),
  );

  return { token, expiresAt };
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await decodeSessionToken(token, getRequiredEnv("SESSION_SECRET"));

    if (new Date(payload.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
