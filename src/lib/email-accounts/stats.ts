import type { EmailAccountRecord } from "./schema";

export type EmailAccountDashboardStats = {
  unlinkedCount: number;
  expiredPercentage: number;
  averageLinkedLifetimeDays: number | null;
};

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateEmailAccountStats(
  records: EmailAccountRecord[],
): EmailAccountDashboardStats {
  const total = records.length;
  const unlinkedCount = records.filter((record) => !record.is_linked_s2a).length;
  const expiredCount = records.filter((record) => record.is_expired).length;

  const lifetimeValues = records
    .filter(
      (record) =>
        record.is_linked_s2a &&
        record.is_expired &&
        record.linked_at &&
        record.expired_at,
    )
    .map((record) => {
      const linkedAt = new Date(record.linked_at as string).getTime();
      const expiredAt = new Date(record.expired_at as string).getTime();

      return (expiredAt - linkedAt) / (1000 * 60 * 60 * 24);
    })
    .filter((value) => Number.isFinite(value) && value >= 0);

  return {
    unlinkedCount,
    expiredPercentage: total === 0 ? 0 : roundToOneDecimal((expiredCount / total) * 100),
    averageLinkedLifetimeDays:
      lifetimeValues.length === 0
        ? null
        : roundToOneDecimal(
            lifetimeValues.reduce((sum, value) => sum + value, 0) / lifetimeValues.length,
          ),
  };
}
