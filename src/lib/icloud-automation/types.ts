export type IcloudAutomationErrorCode =
  | "AUTH_REQUIRED"
  | "PAGE_CHANGED"
  | "CREATE_FAILED"
  | "READ_FAILED"
  | "SAVE_FAILED"
  | "ENV_MISCONFIGURED";

export class IcloudAutomationError extends Error {
  code: IcloudAutomationErrorCode;

  constructor(code: IcloudAutomationErrorCode, message: string) {
    super(message);
    this.name = "IcloudAutomationError";
    this.code = code;
  }
}

export type CreateHideMyEmailResult = {
  email: string;
  requiresInteraction?: boolean;
};

export type IcloudAutomationClient = {
  createHideMyEmail: () => Promise<CreateHideMyEmailResult>;
};
