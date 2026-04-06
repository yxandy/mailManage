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
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#214d3a_0%,#2d694f_55%,#d2b271_100%)] p-10 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_36%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-white/72">后台入口</p>
              <h1 className="max-w-lg text-4xl font-semibold leading-tight">
                邮箱账号管理系统
              </h1>
              <p className="max-w-md text-base leading-7 text-white/82">
                面向单管理员使用，集中管理邮箱账号、关联状态、失效状态和时间信息。
              </p>
            </div>
            <div className="grid gap-4 rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div>
                <p className="text-sm text-white/68">当前版本聚焦</p>
                <p className="mt-1 text-lg font-medium">登录、列表、分页、增改删</p>
              </div>
              <div className="grid gap-2 text-sm text-white/80">
                <p>1. 仅管理员账号可登录</p>
                <p>2. 支持搜索、筛选和分页</p>
                <p>3. 删除采用软删除保留历史记录</p>
              </div>
            </div>
          </div>
        </div>

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
