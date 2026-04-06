import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/auth";
import { verifyPassword } from "@/lib/auth/password";
import { findAdminUserByUsername } from "@/lib/auth/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim();
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    const adminUser = await findAdminUserByUsername(username);

    if (!adminUser) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, adminUser.password_hash);

    if (!isValidPassword) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const { token, expiresAt } = await createSessionToken(adminUser.username);
    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "登录失败",
      },
      { status: 500 },
    );
  }
}
