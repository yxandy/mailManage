import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentSession } from "@/lib/auth/auth";

export default async function LoginPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl rounded-[32px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)]">
        <div className="flex items-center justify-center bg-[var(--panel)] p-8 lg:p-10">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--muted)]">
                管理员登录
              </p>
              <h2 className="text-3xl font-semibold">输入账号进入后台</h2>
              <p className="text-sm leading-7 text-[var(--muted)]">
                系统不提供注册入口，管理员账号由数据库预置。
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
