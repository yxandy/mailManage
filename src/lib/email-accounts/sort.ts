export type EmailAccountOrderRule = {
  column: "is_linked_s2a" | "registered_at" | "created_at";
  options: {
    ascending: boolean;
    nullsFirst: boolean;
  };
};

export function getEmailAccountOrderRules(): EmailAccountOrderRule[] {
  return [
    {
      column: "is_linked_s2a",
      options: { ascending: true, nullsFirst: false },
    },
    {
      column: "registered_at",
      options: { ascending: true, nullsFirst: false },
    },
    {
      column: "created_at",
      options: { ascending: true, nullsFirst: false },
    },
  ];
}
