# `group` Field Audit — Register Components

The `group` field should be a **dropdown** (`type: "select"`, `options: GROUPS`) everywhere,
matching the main `DGGIComponent` COLUMNS definition (line 234–240).

## GROUPS constant (defined in DGGIComponent.tsx)
```ts
const GROUPS = ["Group A", "Group B", "Group C", "Group D", "Group E"]
```

---

## Files that need fixing (`type: "text"` → `type: "select"`)

| # | File | Line(s) | Notes |
|---|------|---------|-------|
| 1 | `AlertCircularRegisterComponent.tsx` | 83 | single occurrence |
| 2 | `ArrestRegisterComponent.tsx` | 165 | single occurrence |
| 3 | `CPGRAMRegisterComponent.tsx` | 41 | single occurrence |
| 4 | `ClosureRegisterComponent.tsx` | 140, 156 | two column arrays (IR + NON-IR) |
| 5 | `DFLRegisterComponent.tsx` | 43 | single occurrence |
| 6 | `EvidenceRoomComponent.tsx` | 45 | single occurrence |
| 7 | `IncidentReportComponent.tsx` | 100 | single occurrence |
| 8 | `InformerRewardComponent.tsx` | 42 | single occurrence |
| 9 | `IntelligenceAllocationComponent.tsx` | 174 | inside STR_COLS array |
| 10 | `ModusOperandiRegisterComponent.tsx` | 66 | single occurrence |
| 11 | `NonIRCaseRegisterComponent.tsx` | 112 | single occurrence |
| 12 | `ProsecutionRegisterComponent.tsx` | 59, 90 | two column arrays (ARREST_COLS + NON_ARREST_COLS) |
| 13 | `ProvisionalAttachmentComponent.tsx` | 163 | single occurrence |
| 14 | `ReportComplianceComponent.tsx` | 38 | single occurrence |
| 15 | `SCNRegisterComponent.tsx` | 150 | single occurrence |
| 16 | `STRRegisterComponent.tsx` | 41 | single occurrence |
| 17 | `SeizureRegisterComponent.tsx` | 112 | single occurrence |
| 18 | `DGGIComponent.tsx` (inline sub-register columns) | 1411, 1441, 1463 | ARREST_COLUMNS, PROVISIONAL_COLUMNS, SCN_COLUMNS defined inline |

**Total: 18 files, 22 column definitions**

---

## Already correct

| File | Line | Status |
|------|------|--------|
| `DGGIComponent.tsx` (main COLUMNS) | 234 | ✅ `type: "select"`, `options: [...GROUPS]` |

---

## Fix pattern

Each `{ key: "group", label: "Group", type: "text", width: "120px" }` becomes:

```ts
{ key: "group", label: "Group", type: "select", options: ["Group A", "Group B", "Group C", "Group D", "Group E"], width: "120px" }
```

Files that use `RegisterRecordDialog` / `RegisterColumn` will render the dropdown automatically
because `RegisterRecordDialog.renderField` already handles `type: "select"`.

Files that have their own inline `EditableCell` or `renderCell` (e.g. `ProvisionalAttachmentComponent`,
`ArrestRegisterComponent`) need no extra change — their cell renderers already handle `select` via
the `RegisterRecordDialog` path, and display-only cells just show the value as text regardless.
