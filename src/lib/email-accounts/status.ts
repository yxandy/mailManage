import type { EmailAccountRecord } from "./schema";

export function getEmailNameColorClass(record: EmailAccountRecord): string {
  if (record.is_expired) {
    return "text-[var(--danger)]";
  }

  if (record.is_linked_s2a) {
    return "text-[var(--primary)]";
  }

  if (record.registered_at && record.is_registered_cg && record.cg_registered_at) {
    return "text-[var(--accent-warning-strong)]";
  }

  if (record.registered_at) {
    return "text-[var(--accent-warning)]";
  }

  return "text-[var(--foreground)]";
}
