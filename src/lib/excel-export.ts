import * as XLSX from "xlsx";

/**
 * Column definition for Excel export
 */
export interface ExcelColumn<T = any> {
  key: keyof T;
  label: string;
  type?: "text" | "date" | "number";
  format?: (value: any, row: T) => string | number;
}

/**
 * Options for Excel export
 */
export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

// Indian number system: groups of 2 after the first 3 digits, e.g. 12,34,56,789.00
// Excel format: last group is 3 digits, rest are 2 digits each
const INDIA_NUMBER_FORMAT = `[>=10000000]##\\,##\\,##\\,##0.00;[>=100000]##\\,##\\,##0.00;[>=1000]##\\,##0.00;0.00`;

/**
 * Applies Indian currency number format to all cells in a column.
 * colIdx is 0-based.
 */
const applyIndianFormat = (ws: XLSX.WorkSheet, colIdx: number, rowCount: number) => {
  for (let r = 1; r <= rowCount; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: colIdx });
    if (!ws[addr]) continue;
    ws[addr].z = INDIA_NUMBER_FORMAT;
  }
};

/**
 * Formats a date value for Excel
 */
const formatDateForExcel = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Exports data to Excel file
 * @param data Array of records to export
 * @param columns Column definitions
 * @param options Export options
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  columns: ExcelColumn<T>[],
  options: ExcelExportOptions = {}
) => {
  const {
    filename = "export",
    sheetName = "Sheet1",
    includeTimestamp = true,
  } = options;

  // Transform data based on column definitions
  const exportData = data.map((row) => {
    const transformedRow: Record<string, any> = {};

    columns.forEach((col) => {
      const value = row[col.key];

      // Apply custom format if provided
      if (col.format) {
        transformedRow[col.label] = col.format(value, row);
      }
      // Apply default formatting based on type
      else if (col.type === "date") {
        transformedRow[col.label] = formatDateForExcel(value);
      } else if (col.type === "number") {
        transformedRow[col.label] = value ? Number(value) : "";
      } else {
        transformedRow[col.label] = value || "";
      }
    });

    return transformedRow;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Apply Indian currency format to number columns
  columns.forEach((col, idx) => {
    if (col.type === "number") {
      applyIndianFormat(worksheet, idx, exportData.length);
    }
  });

  // Auto-size columns
  const colWidths = columns.map((col) => {
    const maxLength = Math.max(
      col.label.length,
      ...data.map((row) => {
        const value = row[col.key];
        return String(value || "").length;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Max width 50
  });
  worksheet["!cols"] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate filename with timestamp
  const timestamp = includeTimestamp
    ? `_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}`
    : "";
  const finalFilename = `${filename}${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, finalFilename);
};

/**
 * Export multiple sheets to a single Excel file
 */
export const exportMultipleSheets = <T extends Record<string, any>>(
  sheets: Array<{
    name: string;
    data: T[];
    columns: ExcelColumn<T>[];
  }>,
  filename: string = "export"
) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data, columns }) => {
    // Transform data
    const exportData = data.map((row) => {
      const transformedRow: Record<string, any> = {};
      columns.forEach((col) => {
        const value = row[col.key];
        if (col.format) {
          transformedRow[col.label] = col.format(value, row);
        } else if (col.type === "date") {
          transformedRow[col.label] = formatDateForExcel(value);
        } else if (col.type === "number") {
          transformedRow[col.label] = value ? Number(value) : "";
        } else {
          transformedRow[col.label] = value || "";
        }
      });
      return transformedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Apply Indian currency format to number columns
    columns.forEach((col, idx) => {
      if (col.type === "number") {
        applyIndianFormat(worksheet, idx, exportData.length);
      }
    });

    // Auto-size columns
    const colWidths = columns.map((col) => {
      const maxLength = Math.max(
        col.label.length,
        ...data.map((row) => String(row[col.key] || "").length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, finalFilename);
};
