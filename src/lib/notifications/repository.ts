import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getNextNotificationAttemptAt, shouldFailNotificationEvent } from "./retry";
import type {
  CreateNotificationEventInput,
  NotificationEventRecord,
  NotificationEventView,
} from "./types";

export function mapNotificationEventRecordToView(
  record: NotificationEventRecord,
): NotificationEventView {
  return {
    id: record.id,
    source: record.source,
    type: record.event_type,
    title: record.title,
    content: record.content,
    payload: record.payload ?? {},
    createdAt: record.created_at,
  };
}

export async function createNotificationEvent(
  input: CreateNotificationEventInput,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("notification_events").upsert(
    {
      source: input.source,
      event_type: input.eventType,
      dedupe_key: input.dedupeKey,
      title: input.title,
      content: input.content,
      payload: input.payload ?? {},
      max_attempts: input.maxAttempts ?? 3,
    },
    {
      onConflict: "dedupe_key",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    throw new Error(`写入提醒事件失败：${error.message}`);
  }
}

export async function listPendingNotificationEvents(limit = 20): Promise<NotificationEventRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`查询待发送提醒事件失败：${error.message}`);
  }

  return (data ?? []) as NotificationEventRecord[];
}

export async function markNotificationEventSent(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("notification_events")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      failed_at: null,
      last_error: null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`标记提醒事件已发送失败：${error.message}`);
  }
}

export async function markNotificationEventFailed(id: string, errorMessage: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("notification_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`查询提醒事件失败：${error.message}`);
  }

  if (!data) {
    throw new Error("未找到对应的提醒事件");
  }

  const record = data as NotificationEventRecord;
  const nextAttemptCount = record.attempt_count + 1;
  const isFinalFailure = shouldFailNotificationEvent({
    attemptCountAfterFailure: nextAttemptCount,
    maxAttempts: record.max_attempts,
  });
  const { error: updateError } = await supabase
    .from("notification_events")
    .update({
      status: isFinalFailure ? "failed" : "pending",
      attempt_count: nextAttemptCount,
      next_attempt_at: isFinalFailure
        ? record.next_attempt_at
        : getNextNotificationAttemptAt(nextAttemptCount),
      failed_at: isFinalFailure ? new Date().toISOString() : null,
      last_error: errorMessage.trim() || "发送失败",
    })
    .eq("id", id);

  if (updateError) {
    throw new Error(`标记提醒事件发送失败状态失败：${updateError.message}`);
  }
}
