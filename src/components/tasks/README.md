# Shared Task Components

This directory contains shared components for task creation and management. These components are designed to be reused across different parts of the application to maintain consistent UI and functionality.

## Components

### TaskForm

A comprehensive form component that standardizes all task form fields across both task creation and task editing views. This component ensures UI consistency throughout the application by managing its own data fetching and state internally.

**Key Features:**

- **Self-contained**: Manages its own data fetching, state, and API calls
- **Consistent behavior**: Same functionality works identically on both new task and edit task screens
- **Flexible overrides**: Allows parent components to override specific behaviors when needed
- **Built-in integrations**: Includes workspace users, timer context, time tracking, and document management

#### Basic Usage

**For editing existing tasks:**

```tsx
<TaskForm
  mode="edit"
  taskId="task-123"
  onTaskUpdate={(updatedTask) => {
    // Handle task updates
    console.log("Task updated:", updatedTask);
  }}
/>
```

**For creating new tasks:**

```tsx
<TaskForm
  mode="new"
  initialValues={{
    priority: "High",
    startDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  }}
  onTaskUpdate={(taskData) => {
    // Handle task data changes during creation
    setNewTaskData(taskData);
  }}
/>
```

#### Advanced Usage with Overrides

```tsx
<TaskForm
  mode="edit"
  taskId="task-123"
  onTaskUpdate={(updatedTask) => {
    setTaskData(updatedTask);
  }}
  overrides={{
    // Override document handling
    onDocumentAdd: handleCustomDocumentUpload,
    onDocumentRemove: handleCustomDocumentRemoval,
    onDocumentView: handleCustomDocumentView,
    isUploadingDocuments: isCustomUploading,

    // Override specific field behaviors if needed
    onTaskStatusChange: handleCustomStatusChange,
    onPriorityChange: handleCustomPriorityChange,
  }}
/>
```

#### Props

| Prop               | Type                       | Required       | Description                                           |
| ------------------ | -------------------------- | -------------- | ----------------------------------------------------- |
| `mode`             | `"new" \| "edit"`          | ✅             | Determines if creating a new task or editing existing |
| `taskId`           | `string`                   | ✅ (edit mode) | ID of task to edit (required for edit mode)           |
| `onTaskUpdate`     | `(task: any) => void`      | ❌             | Callback when task data changes                       |
| `onTaskNameChange` | `(e: ChangeEvent) => void` | ❌             | Callback for task name changes                        |
| `initialValues`    | `object`                   | ❌             | Initial values for new tasks                          |
| `overrides`        | `object`                   | ❌             | Override specific behaviors                           |

#### Internal Features

The TaskForm component automatically handles:

- ✅ **Data fetching**: Loads task data, workspace users, time entries, and automation status
- ✅ **State management**: Manages all form state internally with optimistic updates
- ✅ **API integration**: Handles all task update API calls with error handling
- ✅ **Time tracking**: Integrates with timer context and manages time entries
- ✅ **Document management**: Handles document upload, removal, and viewing
- ✅ **User assignment**: Includes automatic assignment and manual selection
- ✅ **Validation**: Built-in validation for dates, file types, etc.
- ✅ **Loading states**: Shows appropriate loading indicators
- ✅ **Error handling**: Displays user-friendly error messages

#### Migration from Old Interface

**Before (complex prop drilling):**

```tsx
<TaskForm
  mode="edit"
  taskData={taskData}
  taskStatus={taskData.status}
  onTaskStatusChange={handleValueChange}
  isChangingTaskStatus={isChangingTaskStatus}
  startDate={convertedStartDate}
  onStartDateChange={handleStartDateChange}
  // ... 50+ more props
/>
```

**After (simplified):**

```tsx
<TaskForm
  mode="edit"
  taskId={taskId}
  onTaskUpdate={(updatedTask) => setTaskData(updatedTask)}
/>
```

### TaskFormFields

A sub-component that handles the core task fields (status, dates, priority, assignee). This is used internally by TaskForm and can also be used standalone for custom implementations.

### SubtaskManager

Handles subtask selection and creation. Can be used independently or as part of TaskForm.

### SimplifiedOCRUpload

Manages document upload, display, and actions with enhanced features including document scanning and camera capture. Integrated into TaskForm but can be used standalone. This component replaces the old DocumentUpload with better UX and additional functionality.

**Key Features:**

- Document upload with drag & drop
- Document scanning with camera capture
- Duplicate prevention
- Modern pill-style UI
- Support for PDF, images, and scanned documents

## Benefits of the New Architecture

1. **Consistency**: Same behavior across all screens using TaskForm
2. **Maintainability**: Single source of truth for task form logic
3. **Reusability**: Easy to use in new contexts without prop drilling
4. **Performance**: Built-in optimizations and debouncing
5. **Developer Experience**: Much simpler API with sensible defaults
6. **Error Handling**: Centralized error handling and user feedback

---

pg_dump \
 "postgresql://postgres.zrkvvedwycdcjjheewef:inVAIFRtVEmU4RQ5@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" \
 --no-owner \
 --no-privileges \
 --table "auth.users" \
 --table "public.votum_workspace" \
 --table "public.votum_users" \
 --table "public.designations" \
 --table "public.dggi_alert_circular_records" \
 --table "public.dggi_arrest_records" \
 --table "public.dggi_closure_records" \
 --table "public.dggi_computed_deadlines" \
 --table "public.dggi_deadline_alerts_sent" \
 --table "public.dggi_incident_report_records" \
 --table "public.dggi_intel_closure_records" \
 --table "public.dggi_intel_other_source_records" \
 --table "public.dggi_intel_rapid_records" \
 --table "public.dggi_modus_operandi_records" \
 --table "public.dggi_mpr_records" \
 --table "public.dggi_non_ir_case_records" \
 --table "public.dggi_notifications" \
 --table "public.dggi_prosecution_arrest_records" \
 --table "public.dggi_prosecution_non_arrest_records" \
 --table "public.dggi_provisional_attachment_records" \
 --table "public.dggi_records" \
 --table "public.dggi_report_compliance_records" \
 --table "public.dggi_scn_records" \
 --table "public.dggi_seizure_records" \
 --table "public.dggi_str_records" \
 --table "public.dggi_user_group_assignments" \
 -f dggi_complete.sql

CLOUD="postgresql://postgres.zrkvvedwycdcjjheewef:inVAIFRtVEmU4RQ5@aws-0-ap-south-1.pooler.supabase.com
:5432/postgres"

npx supabase db dump --db-url "$CLOUD" -f roles.sql --role-only
  npx supabase db dump --db-url "$CLOUD" -f schema.sql
npx supabase db dump --db-url "$CLOUD" -f data.sql --use-copy --data-only
