import PDFDocument from "pdfkit";

export function buildReportPdf(report, owner) {
  const document = new PDFDocument({
    margin: 48,
    size: "A4"
  });

  const chunks = [];
  document.on("data", (chunk) => chunks.push(chunk));

  document.fontSize(24).fillColor("#081c2f").text("InsightForge AI");
  document.moveDown(0.4);
  document.fontSize(18).fillColor("#0f172a").text(report.fileName);
  document.moveDown(0.2);
  document.fontSize(10).fillColor("#475569").text(`Prepared for ${owner.name} • ${owner.email}`);
  document.moveDown(1);
  document.fontSize(14).fillColor("#0f172a").text("Executive Summary");
  document.moveDown(0.4);
  document.fontSize(11).fillColor("#1e293b").text(report.summary, {
    lineGap: 3
  });
  document.moveDown(1);
  document.fontSize(14).fillColor("#0f172a").text("Key Insights");
  document.moveDown(0.5);

  report.insights.forEach((insight, index) => {
    document.fontSize(11).fillColor("#0f172a").text(`${index + 1}. ${insight.title}`);
    document.moveDown(0.2);
    document.fontSize(10).fillColor("#334155").text(insight.detail, {
      lineGap: 2
    });
    document.moveDown(0.5);
  });

  document.moveDown(0.5);
  document.fontSize(14).fillColor("#0f172a").text("Recommendations");
  document.moveDown(0.5);

  report.recommendations.forEach((item, index) => {
    document.fontSize(10).fillColor("#334155").text(`${index + 1}. ${item}`, {
      lineGap: 2
    });
    document.moveDown(0.25);
  });

  document.moveDown(0.7);
  document.fontSize(14).fillColor("#0f172a").text("Dataset Snapshot");
  document.moveDown(0.4);
  document.fontSize(10).fillColor("#334155").text(`Rows: ${report.metrics.totalRows ?? "n/a"}`);
  document.fontSize(10).fillColor("#334155").text(`Columns: ${report.metrics.totalColumns ?? "n/a"}`);
  document.fontSize(10).fillColor("#334155").text(`Primary metric total: ${report.metrics.primaryMetricTotal ?? "n/a"}`);
  document.fontSize(10).fillColor("#334155").text(`Generated: ${new Date(report.createdAt).toLocaleString()}`);
  document.end();

  return new Promise((resolve) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
