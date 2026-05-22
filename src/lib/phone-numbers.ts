export type SplitPhoneNumberResult = {
  dialCode: string;
  localNumber: string;
};

export function splitPhoneNumberByDialCode(input: {
  phoneNumber: string;
  dialCode?: number | string | null;
}): SplitPhoneNumberResult {
  const normalizedPhoneNumber = input.phoneNumber.replace(/\D/g, "");
  const normalizedDialCode = String(input.dialCode ?? "").replace(/\D/g, "");

  if (!normalizedPhoneNumber || !normalizedDialCode) {
    return {
      dialCode: "",
      localNumber: normalizedPhoneNumber || input.phoneNumber.trim(),
    };
  }

  const localNumber = normalizedPhoneNumber.startsWith(normalizedDialCode)
    ? normalizedPhoneNumber.slice(normalizedDialCode.length)
    : normalizedPhoneNumber;

  return {
    dialCode: `+${normalizedDialCode}`,
    localNumber: localNumber || normalizedPhoneNumber,
  };
}
