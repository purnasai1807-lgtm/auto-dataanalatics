import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";
import { Report } from "../models/Report.js";
import { analyzeDataset } from "../services/analysisService.js";
import { enrichAnalysisWithAI } from "../services/aiService.js";
import { parseDatasetBuffer, parseUploadedDataset } from "../services/parseService.js";
import { buildReportPdf } from "../services/pdfService.js";
import { assertReportQuota, consumeReportQuota } from "../services/usageService.js";

const reportIdSchema = z.object({
  reportId: z.string().min(1)
});

function serializeReport(report) {
  const value = typeof report.toObject === "function" ? report.toObject() : report;

  return {
    id: String(value._id),
    ...value,
    _id: String(value._id),
    userId: String(value.userId)
  };
}

async function persistReport(user, fileName, rows, source) {
  await assertReportQuota(user);
  const analysis = analyzeDataset(rows);
  const aiNarrative = await enrichAnalysisWithAI(fileName, analysis);

  const report = await Report.create({
    userId: user.id,
    fileName,
    summary: aiNarrative.executiveSummary,
    insights: aiNarrative.insights,
    recommendations: aiNarrative.recommendations,
    chartData: analysis.chartData,
    metrics: analysis.metrics,
    datasetMeta: analysis.datasetMeta,
    sampleRows: analysis.sampleRows,
    source
  });

  await consumeReportQuota(user);

  return report;
}

export async function analyzeUpload(req, res) {
  const parsed = await parseUploadedDataset(req.file);
  const report = await persistReport(req.user, parsed.fileName, parsed.rows, "upload");
  res.status(201).json({ report: serializeReport(report) });
}

export async function analyzeDemoDataset(req, res) {
  const datasetPath = path.resolve(process.cwd(), env.DEMO_DATASET_PATH);
  const buffer = await fs.readFile(datasetPath);
  const parsed = await parseDatasetBuffer(path.basename(datasetPath), buffer);
  const report = await persistReport(req.user, parsed.fileName, parsed.rows, "demo");
  res.status(201).json({ report: serializeReport(report) });
}

export async function getDemoPreview(req, res) {
  const datasetPath = path.resolve(process.cwd(), env.DEMO_DATASET_PATH);
  const buffer = await fs.readFile(datasetPath);
  const parsed = await parseDatasetBuffer(path.basename(datasetPath), buffer);
  const analysis = analyzeDataset(parsed.rows);

  res.json({
    fileName: parsed.fileName,
    metrics: analysis.metrics,
    sampleRows: analysis.sampleRows,
    columnStats: analysis.datasetMeta.columnStats,
    chartData: analysis.chartData
  });
}

export async function listReports(req, res) {
  const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ reports: reports.map(serializeReport) });
}

export async function getReport(req, res) {
  const { reportId } = reportIdSchema.parse(req.params);
  const report = await Report.findOne({ _id: reportId, userId: req.user.id });

  if (!report) {
    throw new AppError("Report not found.", 404);
  }

  res.json({ report: serializeReport(report) });
}

export async function downloadReportPdf(req, res) {
  const { reportId } = reportIdSchema.parse(req.params);
  const report = await Report.findOne({ _id: reportId, userId: req.user.id });

  if (!report) {
    throw new AppError("Report not found.", 404);
  }

  const pdfBuffer = await buildReportPdf(report, req.user);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${report.fileName.replace(/\.[^/.]+$/, "")}-insightforge.pdf"`);
  res.send(pdfBuffer);
}
