# iCloud 隐藏邮箱接入实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在当前邮箱账号管理后台中增加“创建 1 个 iCloud 隐藏邮箱并自动入库”的能力。

**Architecture:** 保持现有 Next.js 后台为唯一入口，在后台新增一个管理员可见操作按钮，通过新的内部 API 触发本机 Playwright 自动化流程。自动化流程复用本地 Apple 登录态；若登录态失效，则打开可视化浏览器由管理员手动完成登录和双重验证，再继续创建隐藏邮箱并写入现有 `email_accounts` 表。

**Tech Stack:** Next.js App Router、TypeScript、Supabase、Playwright、Node.js 原生测试

---

## 一、范围与原则

### 本次纳入范围

- 后台首页新增“创建 iCloud 隐藏邮箱”入口
- 单次只创建 `1` 个隐藏邮箱
- 仅支持管理员在本机运行
- 支持登录态复用
- 登录失效时允许人工完成 Apple 登录和双重验证
- 成功创建后自动写入现有邮箱记录表

### 本次不纳入范围

- 批量创建
- 云端无人值守执行
- 纯后台模拟 Apple 登录
- 复杂任务队列
- 历史 iCloud 隐藏邮箱批量导入
- 自动绕过双重验证

### 设计原则

- 优先稳定性，不追求无人值守
- 尽量复用现有邮箱数据结构和写入链路
- Apple 凭证、会话、浏览器用户数据一律不进入仓库
- 失败时给出明确错误分类，便于人工处理

## 二、目标交互

### 管理员操作流程

1. 管理员登录后台首页
2. 点击“创建 iCloud 隐藏邮箱”
3. 阅读确认说明并发起创建
4. 系统尝试复用本机 Apple 登录态
5. 若登录态失效，则打开浏览器，管理员手动完成登录和双重验证
6. 系统进入 iCloud+“隐藏邮件地址”页面并创建 1 个新地址
7. 系统读取新地址并写入当前邮箱账号表
8. 后台提示成功并刷新列表

### 页面提示文案要求

- 发起前需提示：将使用本机 Apple 登录态；如登录失效，需要管理员手动完成登录和双重验证
- 执行中需提示：正在打开 iCloud 页面并创建隐藏邮箱
- 成功后需提示：已创建并入库，显示新邮箱地址
- 失败后需提示结构化错误，不返回模糊的“创建失败”

## 三、数据模型设计

### 推荐新增字段

在 `public.email_accounts` 增加字段：

- `source`：文本，可空，记录来源

### 第一版来源值约定

- `manual`：后台手动新增
- `icloud_hide_my_email`：通过 iCloud 隐藏邮箱自动创建并入库

### 入库默认值

通过 iCloud 自动创建成功后，写入值建议如下：

- `email_name`：新创建的隐藏邮箱地址
- `source`：`icloud_hide_my_email`
- `user_name`：`null`
- `birthday`：`null`
- `registered_at`：`null`
- `registered_location`：`null`
- `is_registered_cg`：`false`
- `cg_registered_at`：`null`
- `is_linked_s2a`：`false`
- `linked_at`：`null`
- `is_expired`：`false`
- `expired_at`：`null`

### 兼容策略

- 现有手动新增和编辑流程保持兼容
- `source` 为可空，避免影响旧数据
- 旧记录默认视为手动来源，可先不回填

## 四、自动化架构设计

### 模块划分

建议新增目录：`src/lib/icloud-automation`

建议拆分为以下模块：

- `src/lib/icloud-automation/types.ts`
  - 定义自动化结果、错误类型、页面状态等类型
- `src/lib/icloud-automation/session.ts`
  - 管理 Playwright 持久化会话目录或 storage state
  - 提供“复用会话”“要求人工登录”的基础能力
- `src/lib/icloud-automation/selectors.ts`
  - 集中管理 iCloud 页面定位逻辑
  - 避免选择器散落在业务代码中
- `src/lib/icloud-automation/client.ts`
  - 封装页面跳转、登录态检测、进入 Hide My Email 页面、创建地址、读取结果
- `src/lib/icloud-automation/service.ts`
  - 对业务层暴露 `createOneHideMyEmail()` 等高层方法

### 登录态策略

- 使用 Playwright 持久化浏览器上下文，而不是每次全新登录
- 浏览器会话文件保存在项目外或项目内专用本地目录，但必须加入 `.gitignore`
- 默认优先尝试静默复用已保存的登录态
- 登录态失效时切换到可视化浏览器模式，由管理员手动完成 Apple 登录和双重验证

### 错误分类

建议统一错误码：

- `AUTH_REQUIRED`：需要重新登录 Apple
- `PAGE_CHANGED`：页面结构变化，无法找到目标入口
- `CREATE_FAILED`：发起创建失败
- `READ_FAILED`：创建完成但未能读取邮箱地址
- `SAVE_FAILED`：获取邮箱成功，但写库失败
- `ENV_MISCONFIGURED`：本机自动化环境未准备好

## 五、接口与前端设计

### 新增接口

- `POST /api/icloud-hide-email/create`

### 接口职责

1. 校验后台管理员登录态
2. 调用 `createOneHideMyEmail()`
3. 将返回的新邮箱地址转换为 `email_accounts` 写入数据
4. 返回：
   - `success`
   - `email`
   - `recordId`
   - `requiresInteraction`（如需要可选）

### 首页入口设计

建议在 [dashboard-client.tsx](C:\Users\yxand\Documents\youxiang\src\components\dashboard-client.tsx) 的顶部按钮区新增：

- `创建 iCloud 隐藏邮箱`

建议交互：

- 点击后先出现确认弹窗
- 确认后按钮禁用，展示“创建中...”
- 请求成功后刷新列表并提示新地址
- 请求失败后展示错误说明

### 第一版不做的前端能力

- 批量数量输入
- 创建任务历史面板
- 执行日志时间线
- 自动轮询后台任务状态

## 六、实施任务拆分

### Task 1：补充数据库来源字段

**Files:**
- Modify: `C:\Users\yxand\Documents\youxiang\supabase\schema.sql`
- Create: `C:\Users\yxand\Documents\youxiang\supabase\migrations\2026-04-19-add-email-account-source.sql`
- Modify: `C:\Users\yxand\Documents\youxiang\docs\database-design.md`

**Step 1: 写失败测试或现状断言**

- 在现有 schema 相关测试中补一个关于 `source` 字段透传或默认值的测试
- 若当前测试层不覆盖记录类型，可先补类型和入库映射测试

**Step 2: 运行测试，确认当前失败**

Run: `npm test`
Expected: 与 `source` 相关的断言失败或类型缺失

**Step 3: 更新数据库结构**

- 在 `email_accounts` 中新增可空字段 `source text`
- 补迁移脚本
- 更新数据库说明文档

**Step 4: 运行测试确认通过**

Run: `npm test`
Expected: 新增断言通过，其他测试不回退

### Task 2：更新邮箱记录类型与写入逻辑

**Files:**
- Modify: `C:\Users\yxand\Documents\youxiang\src\lib\email-accounts\schema.ts`
- Modify: `C:\Users\yxand\Documents\youxiang\src\lib\email-accounts\repository.ts`
- Modify: `C:\Users\yxand\Documents\youxiang\src\lib\email-accounts\schema.test.ts`

**Step 1: 写失败测试**

- 为 `source` 字段补归一化或默认值测试
- 若采用手动新增默认 `manual`，则断言对应行为

**Step 2: 运行测试确认失败**

Run: `npm test`
Expected: `source` 字段未定义或映射不正确

**Step 3: 做最小实现**

- 扩展 `EmailAccountFormInput`、`EmailAccountWriteInput`、`EmailAccountRecord`
- 保持手动创建兼容
- 更新 repository 的 select 字段

**Step 4: 运行测试确认通过**

Run: `npm test`
Expected: 类型与归一化测试通过

### Task 3：为自动化服务建立可测试骨架

**Files:**
- Create: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\types.ts`
- Create: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\session.ts`
- Create: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\selectors.ts`
- Create: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\client.ts`
- Create: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\service.ts`
- Create: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\service.test.ts`
- Modify: `C:\Users\yxand\Documents\youxiang\src\test\index.test.ts`

**Step 1: 先写失败测试**

- 测 `createOneHideMyEmail()` 的返回结构
- 测错误码透传
- 不直接接真实浏览器，先用 mock client

**Step 2: 运行测试确认失败**

Run: `npm test`
Expected: 模块不存在或结果不符合预期

**Step 3: 写最小实现**

- 先把 service 层和类型层建立起来
- `client` 层先保留接口与伪实现占位

**Step 4: 运行测试确认通过**

Run: `npm test`
Expected: service 层测试通过

### Task 4：新增后台创建接口

**Files:**
- Create: `C:\Users\yxand\Documents\youxiang\src\app\api\icloud-hide-email\create\route.ts`
- Create: `C:\Users\yxand\Documents\youxiang\src\app\api\icloud-hide-email\create\route.test.ts` 或并入现有测试文件
- Modify: `C:\Users\yxand\Documents\youxiang\src\lib\email-accounts\repository.ts`

**Step 1: 写失败测试**

- mock `createOneHideMyEmail()`
- 断言 API 在成功时会把记录写入 `email_accounts`
- 断言未登录返回 `401`
- 断言自动化失败时返回结构化错误

**Step 2: 运行测试确认失败**

Run: `npm test`
Expected: 新 API 路由或写库行为尚未实现

**Step 3: 写最小实现**

- 校验管理员会话
- 调用自动化 service
- 构造默认入库数据并写入
- 返回新地址和记录 ID

**Step 4: 运行测试确认通过**

Run: `npm test`
Expected: API 相关测试通过

### Task 5：接入后台按钮和确认流程

**Files:**
- Modify: `C:\Users\yxand\Documents\youxiang\src\components\dashboard-client.tsx`
- 可选 Create: `C:\Users\yxand\Documents\youxiang\src\components\icloud-hide-email-dialog.tsx`

**Step 1: 写失败测试或组件行为断言**

- 若当前项目没有前端测试框架，可先以最小可读方式实现，并通过人工验证补位
- 至少明确交互状态：初始、创建中、成功、失败

**Step 2: 实现前端交互**

- 新增按钮
- 加确认说明
- 调用新 API
- 成功后 `router.refresh()`
- 失败后提示结构化错误

**Step 3: 运行静态检查**

Run: `npm run lint`
Expected: 通过

### Task 6：接入真实 Playwright 自动化

**Files:**
- Modify: `C:\Users\yxand\Documents\youxiang\package.json`
- Modify: `C:\Users\yxand\Documents\youxiang\.gitignore`
- Modify: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\session.ts`
- Modify: `C:\Users\yxand\Documents\youxiang\src\lib\icloud-automation\client.ts`
- Modify: `C:\Users\yxand\Documents\youxiang\README.md`

**Step 1: 安装 Playwright 并补环境说明**

Run: `npm install -D playwright`
Expected: 安装成功

**Step 2: 先打通“打开页面并检测登录态”**

- 不急着创建邮箱
- 先确认能进入 iCloud 页面并识别是否需要登录

**Step 3: 再实现“进入 Hide My Email 页面并创建 1 个地址”**

- 保持选择器集中管理
- 增加必要等待和失败分类

**Step 4: 手工验证**

- 验证会话有效路径
- 验证登录失效后人工登录路径
- 验证成功写库路径

### Task 7：收尾文档与验证

**Files:**
- Modify: `C:\Users\yxand\Documents\youxiang\README.md`
- Modify: `C:\Users\yxand\Documents\youxiang\docs\plans\2026-04-19-icloud-hide-email-integration-plan.md`

**Step 1: 更新使用说明**

- 写清楚本功能仅支持本机执行
- 写清楚首次登录与双重验证需要人工参与
- 写清楚会话文件不应提交到仓库

**Step 2: 完整回归**

Run: `npm test`
Expected: 全部通过

Run: `npm run lint`
Expected: 通过

**Step 3: 记录已验证场景**

- 登录态有效时创建成功
- 登录态失效时人工登录后创建成功
- 页面元素变化时能返回明确错误
- 写库失败时不会误报成功

## 七、人工验证清单

- 点击按钮后能看到明确确认说明
- 创建过程中按钮禁用，不可重复触发
- Apple 登录态有效时，可直接完成创建
- Apple 登录态无效时，会打开浏览器并允许人工完成双重验证
- 新创建地址成功出现在后台列表中
- 新记录默认未关联、未失效
- 失败时前端能展示明确原因

## 八、风险与对策

### 风险 1：Apple 页面结构变更

对策：

- 将页面定位逻辑集中在 `selectors.ts`
- 错误统一归类为 `PAGE_CHANGED`

### 风险 2：会话频繁失效

对策：

- 使用持久化浏览器上下文
- 将人工登录作为正式流程的一部分，而不是异常兜底

### 风险 3：自动化只适用于本机

对策：

- 在文档中明确能力边界
- 第一版不承诺云端部署可用

### 风险 4：Apple 凭证泄漏

对策：

- 不在仓库中保存账号密码
- 会话目录加入 `.gitignore`
- README 中写明本地安全要求

## 九、AGENTS.md 判断

本方案当前不建议写入 `AGENTS.md`，原因如下：

- “接入 iCloud 隐藏邮箱”属于阶段性产品能力，不是长期稳定协作规则
- Playwright 自动化方案属于当前功能实现策略，未来可能调整
- Apple 会话、本机执行、人工双重验证等都属于具体功能约束，更适合写入 `docs/plans` 与 `README.md`

如果未来该能力稳定成为项目长期方向，再考虑把以下一句抽象规则写入 `AGENTS.md`：

- 涉及第三方账号网页登录自动化时，优先采用本机浏览器会话复用与人工双重验证，不在仓库中保存第三方账号凭证

当前阶段先不落入 `AGENTS.md`。
