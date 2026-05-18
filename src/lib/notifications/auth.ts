export function getNotificationWorkerToken(): string {
  return process.env.NOTIFICATION_WORKER_TOKEN ?? "";
}

export function isNotificationWorkerAuthorized(request: Request): boolean {
  const token = getNotificationWorkerToken();

  if (!token) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${token}`;
}
