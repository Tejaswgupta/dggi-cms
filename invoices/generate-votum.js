const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, TabStopType, TabStopPosition,
  VerticalAlign } = require('docx');
const fs = require('fs');

const none = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: none, bottom: none, left: none, right: none };
const thinGray = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
const thinGrayBorders = { top: thinGray, bottom: thinGray, left: none, right: none };

// Votum: Ultra-minimal, borderless table, strong left accent bar feel,
// invoice details in a horizontal strip, zebra rows
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 20, color: "222222" } } },
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, right: 1080, bottom: 800, left: 1080 } },
    },
    children: [
      // ── Top accent line (paragraph with top border acts as a rule)
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 24, color: "1E3A5F", space: 0 } },
        spacing: { after: 0, before: 0 },
        children: [],
      }),

      // ── Company name + "PROFORMA INVOICE" pill on same line
      new Paragraph({
        spacing: { before: 240, after: 0 },
        children: [
          new TextRun({ text: "Votum Solutions Private Limited", bold: true, size: 32, color: "1E3A5F" }),
          new TextRun({ text: "\t" }),
          new TextRun({ text: "PROFORMA INVOICE", bold: true, size: 18, color: "FFFFFF",
            highlight: undefined, shading: undefined }),
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      }),

      // Company address line
      new Paragraph({
        spacing: { before: 60, after: 20 },
        children: [
          new TextRun({ text: "802, Atlanta, Nr. Sears Tower, Gulbai Tekra, Ahmedabad, Gujarat  |  GSTIN: 24AALCV8165H1ZW  |  PAN: AALCV8165H", size: 16, color: "888888" }),
        ],
      }),

      // ── Horizontal divider
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD", space: 4 } },
        spacing: { after: 240 },
        children: [],
      }),

      // ── Invoice meta strip (shaded row using table)
      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [2520, 2520, 2520, 2520],
        rows: [new TableRow({
          children: [
            new TableCell({
              borders: noBorders, shading: { fill: "F4F7FB", type: ShadingType.CLEAR },
              width: { size: 2520, type: WidthType.DXA },
              margins: { top: 120, bottom: 120, left: 200, right: 80 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Invoice No.", size: 16, color: "888888" })] }),
                new Paragraph({ children: [new TextRun({ text: "VS-PI-2026-001", bold: true, size: 20, color: "1E3A5F" })] }),
              ],
            }),
            new TableCell({
              borders: noBorders, shading: { fill: "F4F7FB", type: ShadingType.CLEAR },
              width: { size: 2520, type: WidthType.DXA },
              margins: { top: 120, bottom: 120, left: 200, right: 80 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Date", size: 16, color: "888888" })] }),
                new Paragraph({ children: [new TextRun({ text: "15 July 2026", bold: true, size: 20 })] }),
              ],
            }),
            new TableCell({
              borders: noBorders, shading: { fill: "F4F7FB", type: ShadingType.CLEAR },
              width: { size: 2520, type: WidthType.DXA },
              margins: { top: 120, bottom: 120, left: 200, right: 80 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Valid Until", size: 16, color: "888888" })] }),
                new Paragraph({ children: [new TextRun({ text: "30 Days", bold: true, size: 20 })] }),
              ],
            }),
            new TableCell({
              borders: noBorders, shading: { fill: "1E3A5F", type: ShadingType.CLEAR },
              width: { size: 2520, type: WidthType.DXA },
              margins: { top: 120, bottom: 120, left: 200, right: 80 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Grand Total", size: 16, color: "8AABCC" })] }),
                new Paragraph({ children: [new TextRun({ text: "₹ 4,80,000", bold: true, size: 22, color: "FFFFFF" })] }),
              ],
            }),
          ],
        })],
      }),

      // ── Bill To
      new Paragraph({ spacing: { before: 360, after: 80 }, children: [
        new TextRun({ text: "BILLED TO", size: 16, bold: true, color: "AAAAAA" }),
      ]}),
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Pr. ADG (Principal Additional Director General)", bold: true, size: 22 })] }),
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: "Directorate General of GST Intelligence (DGGI)", size: 20, color: "444444" })] }),
      new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: "Mumbai Zonal Unit (MZU), Mumbai, Maharashtra", size: 20, color: "444444" })] }),

      // ── Services table — borderless with zebra shading, no Sr. column
      new Paragraph({ spacing: { before: 360, after: 120 }, children: [
        new TextRun({ text: "SERVICES", size: 16, bold: true, color: "AAAAAA" }),
      ]}),
      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [6280, 1200, 1300, 1300],
        rows: [
          // Header
          new TableRow({ children: [
            new TableCell({ borders: noBorders, width: { size: 6280, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 0, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "Description", size: 16, bold: true, color: "888888" })] })] }),
            new TableCell({ borders: noBorders, width: { size: 1200, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Qty", size: 16, bold: true, color: "888888" })] })] }),
            new TableCell({ borders: noBorders, width: { size: 1300, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Rate (₹)", size: 16, bold: true, color: "888888" })] })] }),
            new TableCell({ borders: noBorders, width: { size: 1300, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 80, right: 0 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Amount (₹)", size: 16, bold: true, color: "888888" })] })] }),
          ]}),
          // Data row (shaded)
          new TableRow({ children: [
            new TableCell({ borders: { top: thinGray, bottom: thinGray, left: none, right: none }, shading: { fill: "F9FAFC", type: ShadingType.CLEAR }, width: { size: 6280, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 0, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "Development and Deployment of Case Management & Tracking Software for DGGI Mumbai Zonal Unit", size: 20 })] })] }),
            new TableCell({ borders: { top: thinGray, bottom: thinGray, left: none, right: none }, shading: { fill: "F9FAFC", type: ShadingType.CLEAR }, width: { size: 1200, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1", size: 20 })] })] }),
            new TableCell({ borders: { top: thinGray, bottom: thinGray, left: none, right: none }, shading: { fill: "F9FAFC", type: ShadingType.CLEAR }, width: { size: 1300, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "4,06,780", size: 20 })] })] }),
            new TableCell({ borders: { top: thinGray, bottom: thinGray, left: none, right: none }, shading: { fill: "F9FAFC", type: ShadingType.CLEAR }, width: { size: 1300, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 80, right: 0 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "4,06,780", size: 20 })] })] }),
          ]}),
        ],
      }),

      // ── Totals (plain right-aligned, no table)
      new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.RIGHT, children: [
        new TextRun({ text: "Subtotal\t₹ 4,06,780", size: 18, color: "666666" }),
      ], tabStops: [{ type: TabStopType.RIGHT, position: 10080 }] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, children: [
        new TextRun({ text: "IGST @ 18%\t₹ 73,220", size: 18, color: "666666" }),
      ], tabStops: [{ type: TabStopType.RIGHT, position: 10080 }] }),
      new Paragraph({ spacing: { before: 80 }, alignment: AlignmentType.RIGHT,
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 4 } },
        children: [
          new TextRun({ text: "Grand Total\t₹ 4,80,000", size: 24, bold: true, color: "1E3A5F" }),
        ], tabStops: [{ type: TabStopType.RIGHT, position: 10080 }] }),
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 300 }, children: [
        new TextRun({ text: "Rupees Four Lakh Eighty Thousand Only", size: 16, italics: true, color: "999999" }),
      ]}),

      // ── Bottom section: Terms left, Signatory right (two-column table)
      new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [6000, 4080],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: noBorders,
            width: { size: 6000, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 0, right: 200 },
            children: [
              new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "PAYMENT TERMS", size: 16, bold: true, color: "AAAAAA" })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "This is a Proforma Invoice and not a Tax Invoice.", size: 17, color: "555555" })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Issued for advance payment / order approval purpose only.", size: 17, color: "555555" })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Payment to be made within 15 days from the date of invoice.", size: 17, color: "555555" })] }),
              new Paragraph({ children: [new TextRun({ text: "GST will be charged as applicable at the time of final invoice.", size: 17, color: "555555" })] }),
            ],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 4080, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 200, right: 0 },
            children: [
              new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "AUTHORISED SIGNATORY", size: 16, bold: true, color: "AAAAAA" })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "For Votum Solutions Private Limited", size: 17, color: "555555" })] }),
              new Paragraph({ spacing: { before: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: "1E3A5F", space: 4 } }, children: [
                new TextRun({ text: "Tejaswa Gupta", bold: true, size: 20, color: "1E3A5F" }),
              ]}),
              new Paragraph({ children: [new TextRun({ text: "Director  |  15 July 2026", size: 16, color: "666666" })] }),
            ],
          }),
        ]})],
      }),

      // Bottom rule
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 24, color: "1E3A5F", space: 4 } },
        spacing: { before: 400 },
        children: [],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/Users/tejaswgupta/Downloads/votum-tasks/invoices/Votum Solutions PI - New.docx", buf);
  console.log("Votum done");
});
