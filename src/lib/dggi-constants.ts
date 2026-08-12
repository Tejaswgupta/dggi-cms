export const DGGI_GROUPS = [
  "Group A",
  "Group B",
  "Group C",
  "Group D",
  "Group E",
  "Group F",
];

export type GroupName = (typeof DGGI_GROUPS)[number];

export const DGGI_ROLES = [
  "ADG",
  "DD_INT",
  "JD",
  "DD",
  "AD",
  "ADC",
  "SIO_INT",
  "SIO",
  "IO",
] as const;

export type DggiRole = (typeof DGGI_ROLES)[number];

export const DGGI_ROLE_LABELS: Record<DggiRole, string> = {
  ADG: "Additional Director General",
  DD_INT: "Deputy Director (Intelligence)",
  JD: "Joint Director",
  DD: "Deputy Director",
  AD: "Assistant Director",
  ADC: "Additional Director",
  SIO_INT: "Senior Intelligence Officer (Intelligence)",
  SIO: "Senior Intelligence Officer",
  IO: "Intelligence Officer",
};

// ── Issue Involved (nature of offence) ─────────────────────────────────────
// Shared across the IR / Non-IR / DGGI registers (dropdown options) and the
// dashboard Issue Involved chart (colors + bucketing). The register dropdowns
// append their own "Others…" free-text option, so it is NOT listed here; the
// chart buckets any stored value outside this list into "Others" on its own.
export const ISSUE_INVOLVED_OPTIONS: string[] = [
  "Fake ITC",
  "Clandestine Supply",
  "Online Money Gaming",
  "Ineligible ITC",
  "Misclassification of Supplies",
  "RCM Import",
  "Tax Collected but not Deposited",
  "Undervaluation",
  "Non Payment/Short Payment of GST",
];

// Chart colors keyed by option label; falls back to the "Others" grey.
export const ISSUE_INVOLVED_COLORS: Record<string, string> = {
  "Fake ITC": "#EF4444",
  "Clandestine Supply": "#8B5CF6",
  "Online Money Gaming": "#F59E0B",
  "Ineligible ITC": "#06B6D4",
  "Misclassification of Supplies": "#10B981",
  "RCM Import": "#3B82F6",
  "Tax Collected but not Deposited": "#EC4899",
  Undervaluation: "#F97316",
  "Non Payment/Short Payment of GST": "#6366F1",
  Others: "#9a9a96",
};
