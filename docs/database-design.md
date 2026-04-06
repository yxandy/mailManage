# 数据库设计说明

## 设计目标

本项目为单管理员后台，数据库设计优先满足以下目标：

- 管理员登录简单可靠
- 邮箱账号数据结构清晰
- 支持软删除
- 便于后续扩展搜索、筛选、分页

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
- `user_name`：用户姓名，可空
- `birthday`：用户生日
- `registered_at`：注册时间，可空
- `registered_location`：注册地点，可空
- `is_linked_s2a`：是否关联 `s2a`
- `linked_at`：关联时间
- `is_expired`：是否已失效
- `expired_at`：失效时间
- `deleted_at`：软删除时间
- `created_at`：创建时间
- `updated_at`：更新时间

## 关键规则

- `is_linked_s2a = false` 时，`linked_at` 必须为空。
- `is_expired = false` 时，`expired_at` 必须为空。
- 列表查询默认过滤 `deleted_at is not null` 的记录。
- `birthday` 使用日期类型。
- `registered_at`、`linked_at`、`expired_at` 使用时间戳类型。
- 当前仅 `email_name` 为必填字段，其他业务字段允许为空。

## 索引建议

- `admin_users.username` 唯一索引
- `email_accounts.deleted_at` 普通索引
- `email_accounts.registered_at` 普通索引
- `email_accounts.email_name` 普通索引
- `email_accounts.user_name` 普通索引
