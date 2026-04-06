# 邮箱账号管理系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个仅供单管理员使用的邮箱账号管理后台，支持用户名密码登录、列表查询、分页、新增、编辑、软删除，并使用 Supabase 存储数据、Vercel 部署应用。

**架构：** 前端采用 Next.js 实现登录页与后台列表页，服务端通过 Next.js 路由处理登录校验与业务写入。数据库使用 Supabase PostgreSQL，管理员账号预置在数据库中，邮箱账号数据通过软删除保留历史记录。

**技术栈：** Next.js、React、TypeScript、Supabase PostgreSQL、Vercel

---

## 一、需求范围确认

### 已确认需求

- 系统仅有 1 个管理员使用
- 登录方式为用户名 + 密码
- 没有注册页
- 管理员账号由数据库预置
- 主页面为邮箱账号列表页
- 支持搜索、筛选、分页
- 支持新增、编辑、软删除
- 新增与编辑使用弹窗表单
- 数据库使用 Supabase
- 项目部署到 Vercel
- 代码托管到 GitHub

### 暂不纳入第一版

- 多管理员与角色权限
- 找回密码
- Excel 导出
- 物理删除
- 审计日志

## 二、数据模型设计

### 表 1：管理员表 `admin_users`

建议字段：

- `id`：UUID，主键
- `username`：文本，唯一，管理员用户名
- `password_hash`：文本，管理员密码哈希
- `created_at`：时间戳，创建时间
- `updated_at`：时间戳，更新时间

约束建议：

- `username` 设置唯一索引
- 密码只保存哈希，不保存明文

### 表 2：邮箱账号表 `email_accounts`

建议字段：

- `id`：UUID，主键
- `email_name`：文本，邮箱账号名称
- `user_name`：文本，用户姓名
- `birthday`：日期，用户生日
- `registered_at`：时间戳，注册时间
- `registered_location`：文本，注册地点
- `is_linked_s2a`：布尔，是否关联 s2a
- `linked_at`：时间戳，可空，关联时间
- `is_expired`：布尔，是否已失效
- `expired_at`：时间戳，可空，失效时间
- `deleted_at`：时间戳，可空，软删除时间
- `created_at`：时间戳，创建时间
- `updated_at`：时间戳，更新时间

字段规则：

- `birthday` 只保存日期
- `registered_at`、`linked_at`、`expired_at` 保存完整时间
- `is_linked_s2a = false` 时，`linked_at` 必须为空
- `is_expired = false` 时，`expired_at` 必须为空
- 软删除通过 `deleted_at` 标记，默认列表不返回已删除记录

## 三、页面与交互设计

### 页面 1：登录页 `/login`

元素：

- 用户名输入框
- 密码输入框
- 登录按钮
- 登录失败提示

行为：

- 输入用户名和密码后提交
- 后端校验数据库中的管理员账号
- 校验成功后写入会话并跳转到后台首页
- 校验失败显示错误信息

### 页面 2：后台首页 `/dashboard`

区域划分：

- 顶部工具栏
- 搜索与筛选区
- 表格区
- 分页区

顶部工具栏：

- 页面标题
- 退出登录按钮
- 新增按钮

搜索与筛选区：

- 搜索关键词
  - 支持按邮箱账号名称搜索
  - 支持按用户姓名搜索
- `是否关联 s2a` 筛选
- `是否已失效` 筛选

表格列：

1. 邮箱账号名称
2. 用户姓名
3. 用户生日
4. 注册时间
5. 注册地点
6. 是否关联 s2a
7. 关联时间
8. 是否已失效
9. 失效时间
10. 操作

操作列：

- 编辑
- 删除

分页：

- 支持页码切换
- 支持每页固定条数，例如 10 条或 20 条

### 弹窗表单

表单字段：

- 邮箱账号名称
- 用户姓名
- 用户生日
- 注册时间
- 注册地点
- 是否关联 s2a
- 关联时间
- 是否已失效
- 失效时间

交互规则：

- 新增与编辑复用同一套表单
- 勾选“是否关联 s2a”后才允许填写关联时间
- 勾选“是否已失效”后才允许填写失效时间
- 提交前进行基础校验

## 四、接口与业务规则

### 登录相关

- `POST /api/login`
  - 输入：`username`、`password`
  - 行为：查询 `admin_users`，对密码做哈希比对
  - 成功：写入登录态
  - 失败：返回错误提示

- `POST /api/logout`
  - 清除登录态

- 页面访问保护
  - 未登录访问 `/dashboard` 时跳转到 `/login`

### 邮箱账号相关

- `GET /api/email-accounts`
  - 支持分页
  - 支持关键词搜索
  - 支持布尔筛选
  - 默认只返回 `deleted_at is null` 的记录

- `POST /api/email-accounts`
  - 新增一条邮箱账号记录

- `PATCH /api/email-accounts/:id`
  - 更新一条邮箱账号记录

- `DELETE /api/email-accounts/:id`
  - 实际执行软删除
  - 将 `deleted_at` 更新为当前时间

### 校验规则

- 邮箱账号名称不能为空
- 用户姓名不能为空
- 注册时间不能为空
- 注册地点不能为空
- 未关联时禁止提交关联时间
- 未失效时禁止提交失效时间

## 五、开发实施顺序

### 任务 1：初始化项目基础结构

**文件：**

- 创建：`package.json`
- 创建：`tsconfig.json`
- 创建：`next.config.*`
- 创建：`src/app/*`
- 创建：`src/components/*`
- 创建：`.env.example`
- 创建：`README.md`

执行内容：

1. 初始化 Next.js + TypeScript 项目
2. 建立基础目录结构
3. 配置环境变量模板
4. 初始化 Git 仓库

### 任务 2：建立数据库结构

**文件：**

- 创建：`supabase/schema.sql`
- 创建：`supabase/seed.sql`
- 创建：`docs/database-design.md`

执行内容：

1. 编写 `admin_users` 建表 SQL
2. 编写 `email_accounts` 建表 SQL
3. 增加必要索引
4. 写入管理员初始账号数据
5. 明确字段约束与默认值

### 任务 3：实现登录与会话保护

**文件：**

- 创建：`src/app/login/page.tsx`
- 创建：`src/app/api/login/route.ts`
- 创建：`src/app/api/logout/route.ts`
- 创建：`src/middleware.ts`
- 创建：`src/lib/auth/*`

执行内容：

1. 实现登录表单页面
2. 实现管理员账号查询与密码比对
3. 写入登录态
4. 实现路由保护
5. 实现退出登录

### 任务 4：实现列表查询与分页

**文件：**

- 创建：`src/app/dashboard/page.tsx`
- 创建：`src/app/api/email-accounts/route.ts`
- 创建：`src/components/email-account-table.tsx`
- 创建：`src/components/pagination.tsx`
- 创建：`src/lib/email-accounts/*`

执行内容：

1. 搭建后台列表页
2. 接入分页查询
3. 支持关键词搜索
4. 支持筛选“是否关联 s2a”
5. 支持筛选“是否已失效”

### 任务 5：实现新增、编辑、软删除

**文件：**

- 创建：`src/components/email-account-form-dialog.tsx`
- 创建：`src/app/api/email-accounts/[id]/route.ts`

执行内容：

1. 实现新增弹窗表单
2. 实现编辑弹窗表单
3. 实现前端字段校验
4. 实现软删除逻辑
5. 提交成功后刷新列表

### 任务 6：完善部署与交付

**文件：**

- 修改：`README.md`
- 修改：`.env.example`
- 创建：`docs/deploy-guide.md`

执行内容：

1. 整理本地开发说明
2. 整理 Supabase 配置说明
3. 整理 Vercel 环境变量说明
4. 整理 GitHub 上传步骤
5. 进行首次部署

## 六、测试建议

第一版至少覆盖以下验证：

- 正确用户名密码可以登录
- 错误用户名或密码无法登录
- 未登录不能访问后台页
- 列表能正确分页
- 搜索结果正确
- 筛选结果正确
- 新增成功后列表可见
- 编辑成功后数据更新
- 删除后数据不再默认显示
- `is_linked_s2a = false` 时不能保留关联时间
- `is_expired = false` 时不能保留失效时间

## 七、关于 AGENTS.md 的建议

`AGENTS.md` 适合保存“长期稳定、对后续所有对话都有效”的协作规则，不适合保存容易变化的产品需求、账号信息或部署密钥。

适合写入 `AGENTS.md` 的内容：

- 固定使用中文回复
- 非代码文档使用中文
- 代码注释使用中文
- 优先使用的技术栈约定
- 仓库目录约定
- 常见命令约定
- 提交规范

不建议写入 `AGENTS.md` 的内容：

- 管理员用户名和密码
- Supabase 密钥
- Vercel 密钥
- 这次项目的临时需求细节
- 将来可能变化的字段规则

更合适的做法：

- 把协作规范放到 `AGENTS.md`
- 把项目需求与方案放到 `docs/plans/` 或 `docs/`
- 把环境变量放到 `.env.local`
- 把建表 SQL 放到 `supabase/`

如果后续你担心换对话丢上下文，最值得尽早沉淀的是：

1. `AGENTS.md` 里的仓库级协作规则
2. `docs/plans/` 里的实施计划
3. `README.md` 里的项目启动方式

## 八、下一步建议

建议下一步直接进入项目初始化，并同时完成以下事情：

1. 初始化 Next.js 项目
2. 初始化 Git 仓库
3. 创建计划中的目录结构
4. 生成 Supabase 建表 SQL
5. 预留 Vercel 与本地环境变量模板

完成后再进入登录和列表功能开发。
