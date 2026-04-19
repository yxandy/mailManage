import { createIcloudAutomationClient } from "./client.ts";
import { IcloudAutomationError } from "./types.ts";
import type { CreateHideMyEmailResult, IcloudAutomationClient } from "./types.ts";

type CreateOneHideMyEmailOptions = {
  client?: IcloudAutomationClient;
};

export async function createOneHideMyEmail(
  options: CreateOneHideMyEmailOptions = {},
): Promise<CreateHideMyEmailResult> {
  const client = options.client ?? createIcloudAutomationClient();

  try {
    return await client.createHideMyEmail();
  } catch (error) {
    if (error instanceof IcloudAutomationError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new IcloudAutomationError("CREATE_FAILED", error.message);
    }

    throw new IcloudAutomationError("CREATE_FAILED", "创建 iCloud 隐藏邮箱失败");
  }
}
