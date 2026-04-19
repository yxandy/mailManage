import type { SessionPayload } from "../auth/session.ts";
import type { EmailAccountWriteInput } from "../email-accounts/schema.ts";

import { IcloudAutomationError, type CreateHideMyEmailResult } from "./types.ts";

type SuccessBody = {
  success: true;
  email: string;
  recordId: string;
  requiresInteraction: boolean;
};

type ErrorBody = {
  error: string;
  code?: string;
};

type CreateIcloudHideEmailRecordResult = {
  status: number;
  body: SuccessBody | ErrorBody;
};

type CreateIcloudHideEmailRecordDeps = {
  getCurrentSession: () => Promise<SessionPayload | null>;
  createOneHideMyEmail: () => Promise<CreateHideMyEmailResult>;
  createEmailAccountAndReturnId: (input: EmailAccountWriteInput) => Promise<string>;
};

function buildIcloudDefaultEmailAccountInput(email: string): EmailAccountWriteInput {
  return {
    email_name: email,
    source: "icloud_hide_my_email",
    user_name: null,
    birthday: null,
    registered_at: null,
    registered_location: null,
    is_registered_cg: false,
    cg_registered_at: null,
    is_linked_s2a: false,
    linked_at: null,
    is_expired: false,
    expired_at: null,
  };
}

export async function createIcloudHideEmailRecord(
  deps?: CreateIcloudHideEmailRecordDeps,
): Promise<CreateIcloudHideEmailRecordResult> {
  const resolvedDeps =
    deps ??
    (await (async () => {
      const [{ getCurrentSession }, { createOneHideMyEmail }, { createEmailAccountAndReturnId }] =
        await Promise.all([
          import("../auth/auth.ts"),
          import("./service.ts"),
          import("../email-accounts/repository.ts"),
        ]);

      return {
        getCurrentSession,
        createOneHideMyEmail,
        createEmailAccountAndReturnId,
      };
    })());

  const session = await resolvedDeps.getCurrentSession();

  if (!session) {
    return {
      status: 401,
      body: { error: "未登录或登录已失效" },
    };
  }

  try {
    const automationResult = await resolvedDeps.createOneHideMyEmail();
    const recordId = await resolvedDeps.createEmailAccountAndReturnId(
      buildIcloudDefaultEmailAccountInput(automationResult.email),
    );

    return {
      status: 200,
      body: {
        success: true,
        email: automationResult.email,
        recordId,
        requiresInteraction: automationResult.requiresInteraction ?? false,
      },
    };
  } catch (error) {
    if (error instanceof IcloudAutomationError) {
      return {
        status: 400,
        body: {
          error: error.message,
          code: error.code,
        },
      };
    }

    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : "创建隐藏邮箱失败",
      },
    };
  }
}
