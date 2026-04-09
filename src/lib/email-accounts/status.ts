import type { EmailAccountRecord } from "./schema";

export function getEmailNameColorClass(record: EmailAccountRecord): string {
  if (record.is_expired) {
    return "text-[var(--email-status-expired)]";
  }

  if (record.is_linked_s2a) {
    return "text-[var(--email-status-linked)]";
  }

  if (record.registered_at && record.is_registered_cg && record.cg_registered_at) {
    return "text-[var(--email-status-registered-cg)]";
  }

  if (record.registered_at) {
    return "text-[var(--email-status-registered)]";
  }

  return "text-[var(--email-status-default)]";
}
