# Excel Export Implementation Guide

This guide explains how to add Excel export functionality to register components in the tasks module.

## Overview

Excel export functionality has been added to task register components using the `xlsx` library. The implementation provides:

- ✅ One-click export to Excel (.xlsx) format
- ✅ Automatic date formatting for Indian locale
- ✅ Auto-sized columns based on content
- ✅ Timestamped filenames
- ✅ Respects current filters and sorting
- ✅ User-friendly success notifications

## Architecture

### Core Files

1. **`src/lib/excel-export.ts`** - Core Excel export utilities
   - `exportToExcel()` - Export single sheet with data
   - `exportMultipleSheets()` - Export multiple sheets to one workbook
   - Type definitions for columns and options

2. **`src/app/tasks/register-utils.ts`** - Register-specific helper
   - `exportRegisterToExcel()` - Simplified wrapper for register components

### Dependencies

- `xlsx` (v0.18.5) - Main library for Excel file generation

## Implementation Steps

### For New Register Components

Follow these steps to add Excel export to a register component:

#### 1. Import Required Dependencies

```tsx
import { Download } from "lucide-react";
import { exportRegisterToExcel } from "./register-utils";
```

#### 2. Add Export Handler

Add this function inside your component (after other handlers like `saveEdit`, `deleteRecord`, etc.):

```tsx
const handleExport = () => {
  exportRegisterToExcel(
    tableRecords, // Your filtered/sorted records
    COLUMNS, // Your COLUMNS definition
    "RegisterName", // Short name (e.g., "STR", "DFL", "CPGRAM")
    (msg) => toast.success(msg),
  );
};
```

#### 3. Update Header UI

Replace the single "Add Record" button with a button group:

**Before:**

```tsx
<Button onClick={() => { setAddingNew(true); ... }}>
  <Plus size={15} />Add Record
</Button>
```

**After:**

```tsx
<div className="flex items-center gap-2">
  <Button
    size="sm"
    variant="outline"
    className="h-9 rounded-lg border-[#EDEDEA] text-[#6b6b6b] hover:bg-[#F3F2EF] text-base shadow-none px-4"
    onClick={handleExport}
    disabled={tableRecords.length === 0}
  >
    <Download size={15} className="mr-1" />
    Export to Excel
  </Button>
  <Button
    size="sm"
    className="h-9 rounded-lg bg-[#4A5FD4] hover:bg-[#3B4EC5] text-white text-base shadow-none px-4"
    onClick={() => { setAddingNew(true); ... }}
  >
    <Plus size={15} className="mr-1" />
    Add Record
  </Button>
</div>
```

That's it! Your register component now has Excel export functionality.

## Examples

### Already Implemented

The following register components already have Excel export:

- ✅ **STRRegisterComponent** (`STRRegisterComponent.tsx`)
- ✅ **DFLRegisterComponent** (`DFLRegisterComponent.tsx`)
- ✅ **CPGRAMRegisterComponent** (`CPGRAMRegisterComponent.tsx`)

### Pending Implementation

These components can follow the same pattern:

- ArrestRegisterComponent
- NonIRCaseRegisterComponent
- ProsecutionRegisterComponent
- IntelligenceAllocationComponent
- ProvisionalAttachmentComponent
- InformerRewardComponent
- ClosureRegisterComponent
- AlertCircularRegisterComponent
- IncidentReportComponent
- ModusOperandiRegisterComponent
- SCNRegisterComponent
- ReportComplianceComponent
- EvidenceRoomComponent

## Advanced Usage

### Custom Date Formatting

If you need custom date formatting beyond the default Indian locale format:

```tsx
import { exportToExcel, type ExcelColumn } from "@/lib/excel-export";

const customColumns: ExcelColumn<YourRecordType>[] = COLUMNS.map((col) => ({
  key: col.key,
  label: col.label,
  type: col.type === "datepicker" ? "date" : "text",
  format:
    col.key === "special_date"
      ? (value) => new Date(value).toLocaleDateString("en-US")
      : undefined,
}));

exportToExcel(records, customColumns, {
  filename: "Custom_Export",
  sheetName: "Custom Sheet",
  includeTimestamp: true,
});
```

### Multi-Sheet Export

To export multiple registers to a single Excel file:

```tsx
import { exportMultipleSheets } from "@/lib/excel-export";

const handleMultiSheetExport = () => {
  exportMultipleSheets(
    [
      {
        name: "STR Records",
        data: strRecords,
        columns: STR_COLUMNS.map((col) => ({
          key: col.key,
          label: col.label,
          type: col.type === "datepicker" ? "date" : "text",
        })),
      },
      {
        name: "DFL Records",
        data: dflRecords,
        columns: DFL_COLUMNS.map((col) => ({
          key: col.key,
          label: col.label,
          type: col.type === "datepicker" ? "date" : "text",
        })),
      },
    ],
    "Combined_Registers",
  );
};
```

## Features & Behavior

### Automatic Behaviors

1. **Date Formatting**: All `datepicker` type columns are automatically formatted as `DD/MM/YYYY`
2. **Column Sizing**: Columns auto-size based on content with a max width of 50 characters
3. **Empty Values**: Empty or null values are displayed as empty strings in Excel
4. **Filename**: Format is `{RegisterName}_Register_{timestamp}.xlsx`

### User Experience

- **Button State**: Export button is disabled when no records exist
- **Success Feedback**: Toast notification shows count of exported records
- **No Loading State**: Export is instant for typical dataset sizes (< 10,000 rows)
- **Browser Download**: File downloads directly to user's default download location

## Troubleshooting

### Common Issues

**Export button doesn't appear**

- Verify you imported `Download` icon from `lucide-react`
- Check that you imported `exportRegisterToExcel` from `./register-utils`

**Dates not formatting correctly**

- Ensure your date columns use `type: "datepicker"` in the COLUMNS array
- Verify dates are stored in ISO format (YYYY-MM-DD) in the database

**Column widths too narrow/wide**

- The library auto-sizes with max 50 chars. To customize, use the advanced `exportToExcel` function directly

**TypeScript errors**

- Ensure your record interface matches the COLUMNS keys
- Use `ExcelColumn<YourRecordType>` for type safety

## Performance Considerations

- **Dataset Size**: Works efficiently up to ~50,000 rows
- **Browser Limits**: Very large exports (>100k rows) may cause memory issues in browser
- **Consider Backend**: For exports >50k rows, consider moving to backend with streaming

## Future Enhancements

Potential improvements to consider:

- [ ] PDF export option
- [ ] CSV export for simpler data
- [ ] Batch export (export all registers at once)
- [ ] Custom column selection (let users choose which columns to export)
- [ ] Export with filters/metadata (e.g., "Exported by User X on Date Y")
- [ ] Scheduled exports (email reports)

## Support

For issues or questions:

- Check existing register implementations (STR, DFL, CPGRAM)
- Review `src/lib/excel-export.ts` for API details
- Refer to `xlsx` library documentation: https://docs.sheetjs.com/
