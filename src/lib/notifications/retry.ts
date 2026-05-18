const NOTIFICATION_RETRY_DELAYS_MS = [60_000, 5 * 60_000];

export function getNextNotificationAttemptAt(attemptCountAfterFailure: number): string {
  const delay =
    NOTIFICATION_RETRY_DELAYS_MS[
      Math.max(0, Math.min(attemptCountAfterFailure - 1, NOTIFICATION_RETRY_DELAYS_MS.length - 1))
    ] ?? NOTIFICATION_RETRY_DELAYS_MS[NOTIFICATION_RETRY_DELAYS_MS.length - 1];

  return new Date(Date.now() + delay).toISOString();
}

export function shouldFailNotificationEvent(params: {
  attemptCountAfterFailure: number;
  maxAttempts: number;
}): boolean {
  return params.attemptCountAfterFailure >= params.maxAttempts;
}
