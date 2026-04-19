# 邮箱账号管理系统

这是一个基于 `Next.js + Supabase + Vercel` 的单管理员后台项目，用于管理邮箱账号信息。

## 当前功能范围

- 管理员用户名密码登录
- 邮箱账号列表展示
- 搜索
- 筛选
- 分页
- 新增
- 编辑
- 软删除

## 技术栈

- `Next.js`
- `TypeScript`
- `Supabase PostgreSQL`
- `Vercel`

## 目录说明

- `src/app`：页面与路由处理
- `src/components`：页面组件
- `src/lib`：业务与工具函数
- `supabase`：建表与初始化 SQL
- `docs`：需求、计划、部署文档

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 复制环境变量模板并填写实际值

```bash
copy .env.example .env.local
```

3. 启动开发环境

```bash
npm run dev
```

4. 浏览器访问 `http://localhost:3000`

## iCloud 隐藏邮箱自动化（本机）

该能力依赖本机浏览器自动化，仅建议在管理员自己的设备上使用。

1. 安装 Playwright 浏览器内核（首次）

```bash
npx playwright install chromium
```

2. 可选环境变量

- `ICLOUD_PLAYWRIGHT_HEADLESS`：是否无头模式，默认 `false`
- `ICLOUD_PLAYWRIGHT_USER_DATA_DIR`：Playwright 持久化会话目录，默认 `.local/icloud-playwright`
- `ICLOUD_MANUAL_LOGIN_TIMEOUT_MS`：人工登录等待超时（毫秒），默认 `180000`

说明：

- 程序会优先复用本机已有 Apple 登录态。
- 若登录态失效，会等待你在浏览器中手动登录并完成双重验证。
- 本地会话目录已加入 `.gitignore`，不会提交到仓库。

## 环境变量

需要在 `.env.local` 中配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `ADMIN_SEED_USERNAME`
- `ADMIN_SEED_PASSWORD`

## 数据库

`supabase/schema.sql` 用于建表。  
`supabase/seed.sql` 用于初始化管理员账号示例。

如果你需要先生成管理员密码哈希，可以运行：

```bash
node scripts/hash-password.mjs 你的管理员密码
```

然后把输出结果替换到 `supabase/seed.sql` 里的 `password_hash`。

## 管理员密码哈希生成

执行下面命令可以生成管理员密码哈希：

```bash
npm run hash:password -- 你的密码
```

把输出结果替换到 `supabase/seed.sql` 的 `password_hash` 中，再执行 SQL。

## 部署

推荐部署方式：

1. 代码推送到 GitHub
2. 在 Supabase 创建项目并执行 SQL
3. 在 Vercel 导入 GitHub 仓库
4. 配置环境变量后完成部署
