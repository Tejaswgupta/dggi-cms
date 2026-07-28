const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, TabStopType, TabStopPosition,
  VerticalAlign } = require('docx');
const fs = require('fs');

const none = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: none, bottom: none, left: none, right: none };
const gold = "C9952B";
const darkGold = "8B6A14";
const black = "1A1A1A";

// Jaackle: Bold centered header block, full-width dark band for invoice title,
// table with left-side gold accent border only (no top/bottom/right), totals in a gold strip
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 20, color: "222222" } } },
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 800, right: 1200, bottom: 800, left: 1200 } },
    },
    children: [
      // ── Company block centered
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
        new TextRun({ text: "Jaackle Infotech Solutions Private Limited", bold: true, size: 36, color: black }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [
        new TextRun({ text: "803, Ratan Castle Apartment, Tilak Nagar, Kanpur - 208002, Uttar Pradesh, India", size: 17, color: "666666" }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [
        new TextRun({ text: "GSTIN: 09AAFCJ6822K1Z7  |  PAN: AAFCJ6822K", size: 16, color: "888888" }),
      ]}),

      // ── Gold double-rule
      new Paragraph({ border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: gold, space: 6 } }, spacing: { before: 160, after: 200 }, children: [] }),

      // ── Dark band: PROFORMA INVOICE title + invoice meta in one table
      new Table({
        width: { size: 9840, type: WidthType.DXA },
        columnWidths: [9840],
        rows: [new TableRow({ children: [
          new TableCell({
            borders: noBorders,
            shading: { fill: "1A1A1A", type: ShadingType.CLEAR },
            width: { size: 9840, type: WidthType.DXA },
            margins: { top: 240, bottom: 240, left: 320, right: 320 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [
                new TextRun({ text: "P  R  O  F  O  R  M  A     I  N  V  O  I  C  E", bold: true, size: 26, color: "FFFFFF" }),
              ]}),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [
                new TextRun({ text: "Invoice No: PI-025    |    Date: 15 July 2026    |    Valid Until: 30 Days", size: 17, color: `${gold}` }),
              ]}),
            ],
          }),
        ]})],
      }),

      // ── Bill To
      new Paragraph({ spacing: { before: 320, after: 80 }, children: [
        new TextRun({ text: "BILL TO", size: 16, bold: true, color: gold }),
      ]}),
      new Paragraph({ spacing: { after: 40 }, indent: { left: 200 }, children: [
        new TextRun({ text: "Pr. ADG (Principal Additional Director General)", bold: true, size: 22 }),
      ]}),
      new Paragraph({ spacing: { after: 20 }, indent: { left: 200 }, children: [
        new TextRun({ text: "Directorate General of GST Intelligence (DGGI)", size: 20, color: "444444" }),
      ]}),
      new Paragraph({ spacing: { after: 20 }, indent: { left: 200 }, children: [
        new TextRun({ text: "Mumbai Zonal Unit (MZU)", size: 20, color: "444444" }),
      ]}),
      new Paragraph({ spacing: { after: 0 }, indent: { left: 200 }, children: [
        new TextRun({ text: "Mumbai, Maharashtra", size: 20, color: "444444" }),
      ]}),

      // ── Line items table: left gold border accent, no other borders
      new Paragraph({ spacing: { before: 320, after: 120 }, children: [
        new TextRun({ text: "PARTICULARS", size: 16, bold: true, color: gold }),
      ]}),

      // Header row
      new Table({
        width: { size: 9840, type: WidthType.DXA },
        columnWidths: [5840, 960, 1520, 1520],
        rows: [
          // Column headers
          new TableRow({ children: [
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 4, color: gold }, left: { style: BorderStyle.SINGLE, size: 12, color: gold }, right: none },
              shading: { fill: "FDF6E8", type: ShadingType.CLEAR },
              width: { size: 5840, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 160, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: "Service Description", bold: true, size: 17, color: "555555" })] })],
            }),
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 4, color: gold }, left: none, right: none },
              shading: { fill: "FDF6E8", type: ShadingType.CLEAR },
              width: { size: 960, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 80, right: 80 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Qty", bold: true, size: 17, color: "555555" })] })],
            }),
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 4, color: gold }, left: none, right: none },
              shading: { fill: "FDF6E8", type: ShadingType.CLEAR },
              width: { size: 1520, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 80, right: 80 },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Unit Price (₹)", bold: true, size: 17, color: "555555" })] })],
            }),
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 4, color: gold }, left: none, right: none },
              shading: { fill: "FDF6E8", type: ShadingType.CLEAR },
              width: { size: 1520, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 80, right: 0 },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Amount (₹)", bold: true, size: 17, color: "555555" })] })],
            }),
          ]}),
          // Data row
          new TableRow({ children: [
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" }, left: { style: BorderStyle.SINGLE, size: 12, color: gold }, right: none },
              width: { size: 5840, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 160, right: 80 },
              children: [new Paragraph({ children: [new TextRun({ text: "Custom Web-Based Case Monitoring & Investigation Tracking Platform for Directorate General of GST Intelligence, Mumbai Zonal Unit", size: 20 })] })],
            }),
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" }, left: none, right: none },
              width: { size: 960, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 80, right: 80 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1", size: 20 })] })],
            }),
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" }, left: none, right: none },
              width: { size: 1520, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 80, right: 80 },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "4,15,254", size: 20 })] })],
            }),
            new TableCell({
              borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" }, left: none, right: none },
              width: { size: 1520, type: WidthType.DXA }, margins: { top: 140, bottom: 140, left: 80, right: 0 },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "4,15,254", size: 20 })] })],
            }),
          ]}),
        ],
      }),

      // ── Totals block: right side, gold grand total strip
      new Table({
        width: { size: 9840, type: WidthType.DXA },
        columnWidths: [5000, 4840],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 5000, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }),
          new TableCell({ borders: noBorders, width: { size: 4840, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              new Table({
                width: { size: 4840, type: WidthType.DXA },
                columnWidths: [2640, 2200],
                rows: [
                  new TableRow({ children: [
                    new TableCell({ borders: noBorders, width: { size: 2640, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "Subtotal", size: 18, color: "666666" })] })] }),
                    new TableCell({ borders: noBorders, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "₹ 4,15,254", size: 18 })] })] }),
                  ]}),
                  new TableRow({ children: [
                    new TableCell({ borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" }, left: none, right: none }, width: { size: 2640, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "IGST @ 18%", size: 18, color: "666666" })] })] }),
                    new TableCell({ borders: { top: none, bottom: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" }, left: none, right: none }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "₹ 74,746", size: 18 })] })] }),
                  ]}),
                  new TableRow({ children: [
                    new TableCell({ borders: noBorders, shading: { fill: gold, type: ShadingType.CLEAR }, width: { size: 2640, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 120, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 20, color: "FFFFFF" })] })] }),
                    new TableCell({ borders: noBorders, shading: { fill: gold, type: ShadingType.CLEAR }, width: { size: 2200, type: WidthType.DXA }, margins: { top: 120, bottom: 120, left: 80, right: 120 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "₹ 4,90,000", bold: true, size: 22, color: "FFFFFF" })] })] }),
                  ]}),
                ],
              }),
            ],
          }),
        ]})],
      }),

      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 100, after: 300 }, children: [
        new TextRun({ text: "Rupees Four Lakh Ninety Thousand Only", size: 16, italics: true, color: "999999" }),
      ]}),

      // ── Gold divider
      new Paragraph({ border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: gold, space: 4 } }, spacing: { after: 240 }, children: [] }),

      // ── Terms + Signatory
      new Table({
        width: { size: 9840, type: WidthType.DXA },
        columnWidths: [5500, 4340],
        rows: [new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 5500, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 200 },
            children: [
              new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "TERMS & DECLARATION", size: 16, bold: true, color: gold })] }),
              ...["This is a Proforma Invoice and not a Tax Invoice.",
                "Issued for advance payment / order approval purpose only.",
                "Payment to be made within 15 days from the date of invoice.",
                "GST will be charged as applicable at the time of final invoice."
              ].map(t => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: `—  ${t}`, size: 17, color: "555555" })] })),
            ],
          }),
          new TableCell({ borders: noBorders, width: { size: 4340, type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 200, right: 0 },
            children: [
              new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "AUTHORISED SIGNATORY", size: 16, bold: true, color: gold })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "For Jaackle Infotech Solutions Private Limited", size: 17, color: "666666" })] }),
              new Paragraph({ spacing: { before: 480 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: gold, space: 4 } },
                children: [new TextRun({ text: "Preeti Gupta", bold: true, size: 22, color: black })],
              }),
              new Paragraph({ children: [new TextRun({ text: "Director  |  15 July 2026", size: 16, color: "666666" })] }),
            ],
          }),
        ]})],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/Users/tejaswgupta/Downloads/votum-tasks/invoices/Jaackle Infotech PI - New.docx", buf);
  console.log("Jaackle done");
});
