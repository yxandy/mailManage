-- 管理员账号初始化示例
-- 实际执行前，请先将 password_hash 替换为真实哈希值。

insert into public.admin_users (username, password_hash)
values ('admin', '7f715066c4e4e36f5125ed6b69de5de0:c571d4c5906a9b0cfa4527112009eccab990017c7c67765a6b21e6ba5e32fbb2e34a3b55a9034f0b8e45229cf3cc49685606f9d340109dccbdb966e57304cd1a')
on conflict (username) do update
set password_hash = excluded.password_hash,
    updated_at = timezone('utc', now());
