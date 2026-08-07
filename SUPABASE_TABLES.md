# Page → Supabase Table Reference

> **On every page:** `votum_users`, `votum_workspace`, `dggi_user_group_assignments` (auth, role checks, workspace isolation)

| Page | Supabase Tables |
|---|---|
| **Sign In** | `votum_workspace`, `votum_users` |
| **Users** | `votum_users`, `dggi_user_group_assignments` |
| **Dashboard** | `votum_users`, `dggi_user_group_assignments`, `votum_workspace`, `dggi_notifications`, `dggi_computed_deadlines`, `dggi_records` |
| **Intelligence Allocation** | `dggi_intel_rapid_records`, `dggi_intel_other_source_records`, `dggi_str_records`, `dggi_records`, `dggi_notifications` |
| **Investigation Cases** | `dggi_records`, `dggi_intel_rapid_records`, `dggi_str_records`, `dggi_arrest_records`, `dggi_scn_records`, `dggi_provisional_attachment_records`, `dggi_prosecution_arrest_records`, `dggi_prosecution_non_arrest_records`, `dggi_closure_records`, `dggi_notifications` |
| **Incident Report** | `dggi_records` |
| **Non-IR View** | `dggi_records` |
| **Arrest Register** | `dggi_arrest_records` |
| **SCN Register** | `dggi_scn_records` |
| **Provisional Attachment** | `dggi_provisional_attachment_records` |
| **Prosecution Register** | `dggi_prosecution_arrest_records`, `dggi_prosecution_non_arrest_records`, `dggi_arrest_records` |
| **Closure Register** | `dggi_closure_records` |
| **Alert Circular** | `dggi_alert_circular_records` |
| **Modus Operandi** | `dggi_modus_operandi_records` |
| **MPR** | `dggi_mpr_records` |
| **Notifications** | `dggi_notifications`, `dggi_computed_deadlines` |
| **Task Detail** | `votum_tasks`, `task_documents`, `votum_task_reviews`, `votum_approval_workflows`, `votum_approval_workflow_steps`, `votum_notifications`, `votum_task_custom_field_templates`, `automation_presets` |
| **Task Automation Status** | `votum_tasks`, `votum_approval_workflows`, `votum_approval_workflow_steps` |
