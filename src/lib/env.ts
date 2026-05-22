type RequiredEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SESSION_SECRET"
  | "HERO_SMS_API_KEY"
  | "SMS_BOWER_API_KEY"
  | "NOTIFICATION_WORKER_TOKEN";

export function getRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`缺少环境变量：${key}`);
  }

  return value;
}
