import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminUserRecord = {
  id: string;
  username: string;
  password_hash: string;
};

export async function findAdminUserByUsername(
  username: string,
): Promise<AdminUserRecord | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, password_hash")
    .eq("username", username)
    .maybeSingle<AdminUserRecord>();

  if (error) {
    throw new Error(`查询管理员账号失败：${error.message}`);
  }

  return data;
}
