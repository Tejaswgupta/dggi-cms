const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, TabStopType, TabStopPosition,
  VerticalAlign } = require('docx');
const fs = require('fs');

const none = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: none, bottom: none, left: none, right: none };
const teal = "0D9488";
const lightTeal = "E6F7F6";
const midTeal = "99E0DA";

// Tendigiflex: Split two-column header (company left, invoice badge right),
// table with alternating teal/white rows + no vertical borders,
// totals as a horizontal full-width strip, numbered terms list
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Calibri", size: 20, color: "1A1A1A" } } },
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 800, right: 960, bottom: 800, left: 960 } },
    },
    children: [
      // ── Split header table
      new Table({
        width: { size: 10320, type: WidthType.DXA },
        columnWidths: [6120, 4200],
        rows: [new TableRow({ children: [
          // Left: company info on teal background
          new TableCell({
            borders: noBorders,
            shading: { fill: teal, type: ShadingType.CLEAR },
            width: { size: 6120, type: WidthType.DXA },
            margins: { top: 240, bottom: 240, left: 300, right: 200 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Tendigiflex Infotech Pvt Ltd", bold: true, size: 28, color: "FFFFFF" })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: '127/115 "S" Block, Juhi, Kanpur - 208014', size: 17, color: "CCF5F2" })] }),
              new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Uttar Pradesh, India", size: 17, color: "CCF5F2" })] }),
              new Paragraph({ children: [new TextRun({ text: "GSTIN: 09AALCT0902G1ZF  |  PAN: AALCT0902G", size: 15, color: "99E8E2" })] }),
            ],
          }),
          // Right: invoice badge on white
          new TableCell({
            borders: { top: none, bottom: none, left: { style: BorderStyle.SINGLE, size: 4, color: teal }, right: none },
            shading: { fill: lightTeal, type: ShadingType.CLEAR },
            width: { size: 4200, type: WidthType.DXA },
            margins: { top: 200, bottom: 200, left: 240, right: 200 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "PROFORMA INVOICE", bold: true, size: 22, color: teal })] }),
              new Paragraph({ spacing: { after: 60 }, children: [
                new TextRun({ text: "No:  ", size: 17, color: "666666" }),
                new TextRun({ text: "TI-PI-2026-004", bold: true, size: 17, color: "1A1A1A" }),
              ]}),
              new Paragraph({ spacing: { after: 60 }, children: [
                new TextRun({ text: "Date:  ", size: 17, color: "666666" }),
                new TextRun({ text: "16 July 2026", bold: true, size: 17 }),
              ]}),
              new Paragraph({ children: [
                new TextRun({ text: "Valid:  ", size: 17, color: "666666" }),
                new TextRun({ text: "30 Days", bold: true, size: 17 }),
              ]}),
            ],
          }),
        ]})],
      }),

      // ── Bill To strip
      new Table({
        width: { size: 10320, type: WidthType.DXA },
        columnWidths: [10320],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 4, color: teal }, left: { style: BorderStyle.SINGLE, size: 18, color: teal }, right: none },
            width: { size: 10320, type: WidthType.DXA },
            margins: { top: 160, bottom: 160, left: 240, right: 200 },
            children: [
              new Paragraph({ children: [
                new TextRun({ text: "BILLED TO:  ", size: 16, bold: true, color: teal }),
                new TextRun({ text: "Pr. ADG (Principal Additional Director General)", bold: true, size: 20 }),
                new TextRun({ text: "   —   Directorate General of GST Intelligence (DGGI), Mumbai Zonal Unit (MZU), Mumbai, Maharashtra", size: 18, color: "444444" }),
              ]}),
            ],
          }),
        ]})],
      }),

      // ── Services table — alternating teal rows, no vertical borders
      new Paragraph({ spacing: { before: 300, after: 100 }, children: [
        new TextRun({ text: "SCOPE OF WORK", size: 16, bold: true, color: teal }),
      ]}),

      new Table({
        width: { size: 10320, type: WidthType.DXA },
        columnWidths: [6520, 880, 1460, 1460],
        rows: [
          // Header row — teal bg
          new TableRow({ children: [
            new TableCell({ borders: noBorders, shading: { fill: teal, type: ShadingType.CLEAR }, width: { size: 6520, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 160, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "Description of Service", bold: true, size: 17, color: "FFFFFF" })] })] }),
            new TableCell({ borders: noBorders, shading: { fill: teal, type: ShadingType.CLEAR }, width: { size: 880, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Unit", bold: true, size: 17, color: "FFFFFF" })] })] }),
            new TableCell({ borders: noBorders, shading: { fill: teal, type: ShadingType.CLEAR }, width: { size: 1460, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Rate (₹)", bold: true, size: 17, color: "FFFFFF" })] })] }),
            new TableCell({ borders: noBorders, shading: { fill: teal, type: ShadingType.CLEAR }, width: { size: 1460, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 80, right: 160 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Amount (₹)", bold: true, size: 17, color: "FFFFFF" })] })] }),
          ]}),
          // Data row — light teal
          new TableRow({ children: [
            new TableCell({ borders: noBorders, shading: { fill: lightTeal, type: ShadingType.CLEAR }, width: { size: 6520, type: WidthType.DXA }, margins: { top: 160, bottom: 160, left: 160, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "End-to-End Digital Case Lifecycle Management Solution for DGGI MZU (Mumbai Zonal Unit)", size: 20 })] })] }),
            new TableCell({ borders: noBorders, shading: { fill: lightTeal, type: ShadingType.CLEAR }, width: { size: 880, type: WidthType.DXA }, margins: { top: 160, bottom: 160, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1", size: 20 })] })] }),
            new TableCell({ borders: noBorders, shading: { fill: lightTeal, type: ShadingType.CLEAR }, width: { size: 1460, type: WidthType.DXA }, margins: { top: 160, bottom: 160, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "4,19,492", size: 20 })] })] }),
            new TableCell({ borders: noBorders, shading: { fill: lightTeal, type: ShadingType.CLEAR }, width: { size: 1460, type: WidthType.DXA }, margins: { top: 160, bottom: 160, left: 80, right: 160 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "4,19,492", size: 20 })] })] }),
          ]}),
        ],
      }),

      // ── Full-width totals strip
      new Table({
        width: { size: 10320, type: WidthType.DXA },
        columnWidths: [3440, 3440, 3440],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorders, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, width: { size: 3440, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 200, right: 80 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Subtotal", size: 17, color: "666666" })] }),
              new Paragraph({ children: [new TextRun({ text: "₹ 4,19,492", bold: true, size: 20 })] }),
            ],
          }),
          new TableCell({ borders: { top: none, bottom: none, left: { style: BorderStyle.SINGLE, size: 2, color: midTeal }, right: { style: BorderStyle.SINGLE, size: 2, color: midTeal } }, shading: { fill: "F5F5F5", type: ShadingType.CLEAR }, width: { size: 3440, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 200, right: 80 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "IGST @ 18%", size: 17, color: "666666" })] }),
              new Paragraph({ children: [new TextRun({ text: "₹ 75,508", bold: true, size: 20 })] }),
            ],
          }),
          new TableCell({ borders: noBorders, shading: { fill: teal, type: ShadingType.CLEAR }, width: { size: 3440, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 200, right: 80 },
            children: [
              new Paragraph({ children: [new TextRun({ text: "Grand Total", size: 17, color: "CCF5F2" })] }),
              new Paragraph({ children: [new TextRun({ text: "₹ 4,95,000", bold: true, size: 24, color: "FFFFFF" })] }),
            ],
          }),
        ]})],
      }),
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 80, after: 300 }, children: [
        new TextRun({ text: "Rupees Four Lakh Ninety-Five Thousand Only", size: 16, italics: true, color: "999999" }),
      ]}),

      // ── Terms (numbered) + Signatory
      new Table({
        width: { size: 10320, type: WidthType.DXA },
        columnWidths: [6000, 4320],
        rows: [new TableRow({ children: [
          new TableCell({ borders: { top: none, bottom: none, left: none, right: { style: BorderStyle.SINGLE, size: 2, color: midTeal } }, width: { size: 6000, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 300 },
            children: [
              new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "TERMS & CONDITIONS", size: 16, bold: true, color: teal })] }),
              ...["This is a Proforma Invoice and not a Tax Invoice.",
                "Issued for advance payment / order approval purpose only.",
                "Payment to be made within 15 days from the date of invoice.",
                "GST will be charged as applicable at the time of final invoice.",
              ].map((t, i) => new Paragraph({ spacing: { after: 80 }, children: [
                new TextRun({ text: `${i + 1}.  `, bold: true, size: 17, color: teal }),
                new TextRun({ text: t, size: 17, color: "444444" }),
              ]})),
            ],
          }),
          new TableCell({ borders: noBorders, width: { size: 4320, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 300, right: 0 },
            children: [
              new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "AUTHORISED SIGNATORY", size: 16, bold: true, color: teal })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "For Tendigiflex Infotech Pvt Ltd", size: 17, color: "666666" })] }),
              new Paragraph({ spacing: { before: 500 },
                border: { top: { style: BorderStyle.DOTTED, size: 4, color: teal, space: 4 } },
                children: [new TextRun({ text: "Kirti Ben", bold: true, size: 22, color: "1A1A1A" })],
              }),
              new Paragraph({ children: [new TextRun({ text: "Director  |  16 July 2026", size: 16, color: "666666" })] }),
            ],
          }),
        ]})],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/Users/tejaswgupta/Downloads/votum-tasks/invoices/Tendigiflex Infotech PI - New.docx", buf);
  console.log("Tendigiflex done");
});
