import test from "node:test";
import assert from "node:assert/strict";

import { splitPhoneNumberByDialCode } from "./phone-numbers.ts";

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
