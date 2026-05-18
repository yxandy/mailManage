export type NotificationEventStatus = "pending" | "sent" | "failed" | "ignored";

export type NotificationEventRecord = {
  id: string;
  source: string;
  event_type: string;
  dedupe_key: string;
  title: string;
  content: string;
  payload: Record<string, unknown>;
  status: NotificationEventStatus;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
  sent_at: string | null;
  failed_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationEventView = {
  id: string;
  source: string;
  type: string;
  title: string;
  content: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CreateNotificationEventInput = {
  source: string;
  eventType: string;
  dedupeKey: string;
  title: string;
  content: string;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
};
