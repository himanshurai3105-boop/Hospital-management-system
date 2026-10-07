const PDFDocument = require("pdfkit");

const C = { text: "#111827", muted: "#6b7280", red: "#b91c1c", amber: "#b45309", line: "#d1d5db", head: "#f3f4f6" };
const MARK = { high: " H", low: " L", abnormal: " *" };

const dt = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "-";

const rangeText = (v) =>
  v.refMin != null || v.refMax != null ? `${v.refMin ?? ""} - ${v.refMax ?? ""}` : v.refText || "";

exports.streamLabPdf = (res, order) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const safeName = String(order.testName).replace(/[^\w.-]+/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="lab-report-${safeName}.pdf"`);
  res.setHeader("Cache-Control", "no-store");
  doc.pipe(res);

  const L = 40;
  const W = 515;
  const p = order.patient || {};
  const d = order.doctor || {};
  const values = order.result?.values || [];
  const amendments = order.result?.amendments || [];

  // ---- Header ----
  doc.fillColor(C.text).font("Helvetica-Bold").fontSize(18).text("CityCare Hospital", L, 40, { width: W, align: "center" });
  doc.font("Helvetica").fontSize(11).fillColor(C.muted).text("Laboratory Report", L, 62, { width: W, align: "center" });
  doc.moveTo(L, 84).lineTo(L + W, 84).strokeColor(C.line).stroke();

  // ---- Patient block ----
  const info = (label, value, x, y) => {
    doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(label, x, y, { width: 80, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.text)
      .text(String(value ?? "-"), x + 80, y, { width: 170, lineBreak: false, ellipsis: true });
  };
  let y = 98;
  info("Patient", p.name, L, y);
  info("Referred by", d.name, 300, y);
  y += 18;
  info("Hospital ID", p.hospitalId, L, y);
  info("Sample ID", order.sampleId || "-", 300, y);
  y += 18;
  info("Age / Sex", `${p.age ?? "-"} yrs / ${p.gender ?? "-"}`, L, y);
  info("Reported on", dt(order.result?.submittedAt), 300, y);
  y += 26;

  doc.moveTo(L, y).lineTo(L + W, y).strokeColor(C.line).stroke();
  y += 12;
  doc.font("Helvetica-Bold").fontSize(14).fillColor(C.text).text(order.testName, L, y, { width: W });
  y += 26;

  // ---- Results table ----
  if (values.length) {
    const cols = [
      { x: L, w: 195, t: "Parameter" },
      { x: 235, w: 95, t: "Result" },
      { x: 335, w: 70, t: "Unit" },
      { x: 410, w: 145, t: "Reference range" },
    ];
    const header = () => {
      doc.rect(L, y, W, 20).fill(C.head);
      doc.fillColor(C.text).font("Helvetica-Bold").fontSize(9);
      cols.forEach((c) => doc.text(c.t, c.x + 4, y + 6, { width: c.w - 8, lineBreak: false }));
      y += 24;
    };
    header();

    for (const v of values) {
      if (y > 760) {
        doc.addPage();
        y = 40;
        header();
      }
      const flagged = ["low", "high", "abnormal"].includes(v.flag);
      const color = v.flag === "low" ? C.amber : flagged ? C.red : C.text;
      const cell = (txt, c, font, clr) =>
        doc.font(font).fontSize(10).fillColor(clr)
          .text(String(txt ?? ""), c.x + 4, y, { width: c.w - 8, lineBreak: false, ellipsis: true });

      cell(v.name, cols[0], "Helvetica", C.text);
      cell(`${v.value}${MARK[v.flag] || ""}`, cols[1], flagged ? "Helvetica-Bold" : "Helvetica", color);
      cell(v.unit, cols[2], "Helvetica", C.text);
      cell(rangeText(v), cols[3], "Helvetica", C.muted);
      y += 20;
      doc.moveTo(L, y - 4).lineTo(L + W, y - 4).strokeColor(C.line).lineWidth(0.5).stroke();
    }
    y += 8;
  }

  // ---- Remarks ----
  if (order.result?.remarks) {
    if (y > 700) {
      doc.addPage();
      y = 40;
    }
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.text).text(values.length ? "Remarks" : "Report", L, y);
    y += 14;
    doc.font("Helvetica").fontSize(10).fillColor(C.text).text(order.result.remarks, L, y, { width: W });
    y = doc.y + 14;
  }

  // ---- Footer ----
  if (y > 700) {
    doc.addPage();
    y = 40;
  }
  doc.moveTo(L, y).lineTo(L + W, y).strokeColor(C.line).stroke();
  y += 8;
  const by = order.result?.submittedBy;
  doc.font("Helvetica").fontSize(9).fillColor(C.muted)
    .text(`Reported by: ${by?.name || "Lab"}${by?.labSpecialization ? ` (${by.labSpecialization.replace(/_/g, " ")})` : ""}`, L, y, { width: W });
  y = doc.y + 2;
  if (amendments.length) {
    doc.text(`This report was amended ${amendments.length} time(s). Last amended: ${dt(amendments[amendments.length - 1].at)}`, L, y, { width: W });
    y = doc.y + 2;
  }
  doc.text("H = High, L = Low, * = Abnormal (outside the reference range). This is a computer-generated report; please consult your doctor.", L, y, { width: W });

  doc.end();
};