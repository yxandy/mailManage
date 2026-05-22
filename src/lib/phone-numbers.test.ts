import test from "node:test";
import assert from "node:assert/strict";

import {
  splitPhoneNumberByDialCode,
  splitPhoneNumberByKnownDialCode,
} from "./phone-numbers.ts";

test("号码会按区号拆成本地号码", () => {
  assert.deepEqual(
    splitPhoneNumberByDialCode({
      phoneNumber: "31685801218",
      dialCode: 31,
    }),
    {
      dialCode: "+31",
      localNumber: "685801218",
    },
  );
});

test("缺少区号时保留原号码作为本地号码", () => {
  assert.deepEqual(
    splitPhoneNumberByDialCode({
      phoneNumber: "31685801218",
      dialCode: null,
    }),
    {
      dialCode: "",
      localNumber: "31685801218",
    },
  );
});

test("可从完整号码识别印尼两位区号，避免按平台国家 ID 拆成一位", () => {
  assert.deepEqual(splitPhoneNumberByKnownDialCode("6285126468687"), {
    dialCode: "+62",
    localNumber: "85126468687",
  });
});

test("可从完整号码识别荷兰区号", () => {
  assert.deepEqual(splitPhoneNumberByKnownDialCode("31685801218"), {
    dialCode: "+31",
    localNumber: "685801218",
  });
});
