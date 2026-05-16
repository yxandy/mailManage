# 数据库设计说明

## 设计目标

本项目为单管理员后台，数据库设计优先满足以下目标：

- 管理员登录简单可靠
- 邮箱账号数据结构清晰
- 支持软删除
- 支持按 `free / plus` 类型分流
- 支持全局单值配置
- 便于后续扩展搜索、筛选、分页与导入流程

## 表结构

### `admin_users`

用于存储后台管理员账号。

字段：

- `id`：主键
- `username`：管理员用户名，唯一
- `password_hash`：密码哈希
- `created_at`：创建时间
- `updated_at`：更新时间

说明：

- 当前仅支持单管理员，但结构保留多管理员扩展空间。
- 只保存密码哈希，不保存明文密码。

### `email_accounts`

用于存储邮箱账号记录。

字段：

- `id`：主键
- `email_name`：邮箱账号名称
- `source`：来源，可空
- `user_name`：用户姓名，可空
- `is_plus`：是否为 `plus` 类型，默认 `false`
- `birthday`：用户生日
- `registered_at`：注册时间，可空
- `registered_location`：注册地点，可空
- `is_registered_cg`：是否已注册 `cg`
- `cg_registered_at`：`cg` 注册时间
- `is_linked_s2a`：是否关联 `s2a`
- `linked_at`：关联时间
- `is_expired`：是否已失效
- `expired_at`：失效时间
- `deleted_at`：软删除时间
- `created_at`：创建时间
- `updated_at`：更新时间

说明：

- 当前仅 `email_name` 为必填字段，其他业务字段允许为空。
- `source` 用于区分手工录入与内部导入等来源。
- `is_plus` 用于区分首页 `free / plus` 两套数据视图。

### `system_settings`

用于存储系统级单例配置。

字段：

- `id`：固定为 `1` 的单例主键
- `cny_price`：人民币数值，保留两位小数
- `updated_at`：更新时间

说明：

- 当前仅承载全局人民币数值配置。
- 该类单值配置不混入 `email_accounts` 明细表。

## 关键规则

- `is_linked_s2a = false` 时，`linked_at` 必须为空。
- `is_registered_cg = false` 时，`cg_registered_at` 必须为空。
- `is_expired = false` 时，`expired_at` 必须为空。
- 列表查询默认只返回 `deleted_at is null` 的有效记录。
- `birthday` 使用日期类型。
- `registered_at`、`linked_at`、`expired_at` 使用时间戳类型。
- `cg_registered_at` 使用时间戳类型。
- 前端对 `registered_at`、`linked_at`、`expired_at`、`cg_registered_at` 当前按日期输入处理，以减少时区偏移问题。
- `system_settings` 通过 `id = 1` 保持单例。

## 索引建议

- `admin_users.username` 唯一索引
- `email_accounts.deleted_at` 普通索引
- `email_accounts.registered_at` 普通索引
- `email_accounts.email_name` 普通索引
- `email_accounts.user_name` 普通索引
- `email_accounts.is_plus` 普通索引

## 迁移说明

当前仓库除完整 `schema.sql` 外，还提供增量迁移脚本，覆盖以下结构演进：

- 邮箱账号非必填字段调整
- `cg` 注册相关字段
- `source` 来源字段
- `is_plus` 类型字段
- `system_settings.cny_price` 单例配置

对于已存在的 Supabase 项目，应优先执行 `supabase/migrations/` 中对应脚本，而不是只参考当前完整建表文件。
