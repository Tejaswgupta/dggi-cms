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
