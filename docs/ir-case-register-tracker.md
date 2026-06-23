# IR Case — Linked Register Tracker

## Overview

A slide-over drawer on each IR case row in the main DGGI Component that aggregates all register records linked to that case. When the case is closed, the drawer surfaces a banner and visually marks every linked register entry accordingly.

No new database tables are required. All data is fetched client-side in parallel on drawer open.

---

## Trigger

An icon button (e.g. `Layers` or `Link`) added to the Actions column of every **IR** row in `DGGIComponent.tsx`. Non-IR rows do not show the button.

---

## Drawer Layout

```
┌─────────────────────────────────────────────────────┐
│  IR-042 — Acme Traders Pvt. Ltd.          [×] Close │
│  ─────────────────────────────────────────────────  │
│  ⚠ CASE CLOSED  ·  Closed After Payment of Tax      │  ← shown only when closure_by is set
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ▸ Arrest                          2 records        │
│  ▸ Provisional Attachment          1 record         │
│  ▸ SCN                             3 records        │
│  ▸ Prosecution — Arrest Cases      1 record         │
│  ▸ Prosecution — Non-Arrest Cases  0 records        │
│  ▸ Evidence Room                   1 record         │
│  ▸ DFL                             0 records        │
│  ▸ Alert / Circular                0 records        │
│  ▸ CPGRAM                          0 records        │
│  ▸ Informer Reward                 0 records        │
└─────────────────────────────────────────────────────┘
```

- Sections with 0 records are collapsed and dimmed by default.
- Each section is an expandable accordion showing a summary table of its records.

---

## Registers Queried

| Register | Supabase Table | Link Field | Completion Status Field |
|---|---|---|---|
| Arrest | `dggi_arrest_records` | `linked_case_id` | `prosecution_filed` (Yes / No / Pending) |
| Provisional Attachment | `dggi_provisional_attachment_records` | `linked_case_id` | `oio_issued` (Yes / No) |
| SCN | `dggi_scn_records` | `linked_case_id` | `adjudication_status` |
| Prosecution — Arrest | `dggi_prosecution_arrest_records` | `linked_case_id` | `prosecution_complaint_status` |
| Prosecution — Non-Arrest | `dggi_prosecution_non_arrest_records` | `linked_case_id` | `prosecution_complaint_status` |
| Evidence Room | `dggi_evidence_room_records` | `linked_case_id` | _(no dedicated status)_ |
| DFL | `dggi_dfl_records` | `linked_case_id` | _(no dedicated status)_ |
| Alert / Circular | `dggi_alert_circular_records` | `linked_case_id` | _(no dedicated status)_ |
| CPGRAM | `dggi_cpgram_records` | `linked_case_id` | _(no dedicated status)_ |
| Informer Reward | `dggi_informer_reward_records` | `linked_case_id` | _(no dedicated status)_ |

---

## Case Closed Behaviour

A case is considered closed when `dggi_records.closure_by` is non-null.

When the drawer opens for a closed case:

1. A prominent banner appears at the top: **"Case Closed · {closure_by}"** with the `closure_reason` if present.
2. Every register record row gets a muted style (reduced opacity) and a `Closed` chip alongside its own status badge.
3. The accordion section headers also show the `Closed` chip next to their record count.

The intent is to make it immediately visible that any open register items (e.g. SCN still "Pending") exist under an already-closed case — flagging potential follow-up work.

---

## Data Fetching

On drawer open, fire one `Promise.all` across all 10 register tables, each filtered by `linked_case_id = caseRecord.record_id`. No caching — always fresh on open.

```ts
const [arrests, attachments, scns, prosArrest, prosNonArrest,
       evidence, dfl, alerts, cpgram, informer] = await Promise.all([
  supabase.from("dggi_arrest_records").select("record_id,arrested_name,date_of_arrest,prosecution_filed,group").eq("linked_case_id", recordId),
  supabase.from("dggi_provisional_attachment_records").select("record_id,person_name,date_of_attachment,oio_issued,group").eq("linked_case_id", recordId),
  supabase.from("dggi_scn_records").select("record_id,noticee_name,date_of_scn,adjudication_status,group").eq("linked_case_id", recordId),
  supabase.from("dggi_prosecution_arrest_records").select("record_id,arrested_person_name,prosecution_complaint_status,group").eq("linked_case_id", recordId),
  supabase.from("dggi_prosecution_non_arrest_records").select("record_id,arrested_person_name,prosecution_complaint_status,group").eq("linked_case_id", recordId),
  supabase.from("dggi_evidence_room_records").select("record_id,group").eq("linked_case_id", recordId),
  supabase.from("dggi_dfl_records").select("record_id,group").eq("linked_case_id", recordId),
  supabase.from("dggi_alert_circular_records").select("record_id,group").eq("linked_case_id", recordId),
  supabase.from("dggi_cpgram_records").select("record_id,group").eq("linked_case_id", recordId),
  supabase.from("dggi_informer_reward_records").select("record_id,group").eq("linked_case_id", recordId),
]);
```

---

## Implementation Plan

### 1. New component: `CaseRegisterDrawer.tsx`
- `src/app/tasks/CaseRegisterDrawer.tsx`
- Props: `caseRecord: DGGIRecord | null`, `open: boolean`, `onOpenChange: (open: boolean) => void`
- Internally manages `loading`, `drawerData` state
- Uses `Sheet` (shadcn) for the slide-over

### 2. Modify `DGGIComponent.tsx`
- Add `drawerCase` state: `useState<DGGIRecord | null>(null)`
- Add `Layers` icon button to the Actions column — only rendered when `record.is_ir === true`
- Render `<CaseRegisterDrawer caseRecord={drawerCase} open={!!drawerCase} onOpenChange={...} />`

### 3. No DB changes required

---

## Out of Scope (for now)

- Editing register records from within the drawer (read-only)
- NON-IR cases (drawer is IR-only)
- DGGIComponent's NON-IR tab
- `SeizureRegisterComponent`, `STRRegisterComponent`, `ModusOperandiRegisterComponent` — these do not have a `linked_case_id` field linking to IR cases
