import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { connectDatabase } from "../src/config/database.js";
import { env } from "../src/config/env.js";
import { Report } from "../src/models/Report.js";
import { User } from "../src/models/User.js";
import { analyzeDataset } from "../src/services/analysisService.js";
import { enrichAnalysisWithAI } from "../src/services/aiService.js";
import { parseDatasetBuffer } from "../src/services/parseService.js";

const seedUsers = [
  {
    name: "Demo Founder",
    email: "demo@insightforge.ai",
    password: "InsightForge123!",
    plan: "free",
    onboardingCompleted: true,
    reportCount: 2
  },
  {
    name: "Pro Operator",
    email: "pro@insightforge.ai",
    password: "InsightForge123!",
    plan: "pro",
    onboardingCompleted: true,
    reportCount: 5
  }
];

function buildReportSummary(report, offset) {
  return {
    ...report,
    createdAt: new Date(Date.now() - offset * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - offset * 24 * 60 * 60 * 1000)
  };
}

async function loadSeedAnalysis() {
  const datasetPath = path.resolve(process.cwd(), env.DEMO_DATASET_PATH);
  const buffer = await fs.readFile(datasetPath);
  const parsed = await parseDatasetBuffer(path.basename(datasetPath), buffer);
  const analysis = analyzeDataset(parsed.rows);
  const aiNarrative = await enrichAnalysisWithAI(parsed.fileName, analysis);

  return {
    fileName: parsed.fileName,
    summary: aiNarrative.executiveSummary,
    insights: aiNarrative.insights,
    recommendations: aiNarrative.recommendations,
    chartData: analysis.chartData,
    metrics: analysis.metrics,
    datasetMeta: analysis.datasetMeta,
    sampleRows: analysis.sampleRows
  };
}

async function upsertSeedUser(userSeed, reportSeed, reset) {
  if (reset) {
    const existing = await User.findOne({ email: userSeed.email.toLowerCase() });
    if (existing) {
      await Report.deleteMany({ userId: existing.id });
      await User.deleteOne({ _id: existing.id });
    }
  }

  let user = await User.findOne({ email: userSeed.email.toLowerCase() });

  if (!user) {
    user = await User.create({
      name: userSeed.name,
      email: userSeed.email.toLowerCase(),
      password: userSeed.password,
      plan: userSeed.plan,
      onboardingCompleted: userSeed.onboardingCompleted,
      reportsUsed: userSeed.plan === "free" ? 1 : 0,
      totalReportsGenerated: userSeed.reportCount
    });
  } else {
    user.name = userSeed.name;
    user.password = userSeed.password;
    user.plan = userSeed.plan;
    user.onboardingCompleted = userSeed.onboardingCompleted;
    user.reportsUsed = userSeed.plan === "free" ? 1 : 0;
    user.totalReportsGenerated = userSeed.reportCount;
    user.usageWindowStartedAt = new Date();
    await user.save();
    await Report.deleteMany({ userId: user.id });
  }

  const reports = Array.from({ length: userSeed.reportCount }, (_, index) => {
    const source = index % 2 === 0 ? "upload" : "demo";
    return buildReportSummary(
      {
        userId: user.id,
        fileName:
          source === "upload"
            ? `client-pipeline-${index + 1}.csv`
            : `sample-${reportSeed.fileName.replace(/\.csv$/i, "")}-${index + 1}.csv`,
        summary:
          index === 0
            ? reportSeed.summary
            : `${reportSeed.summary} Report variation ${index + 1} highlights continued momentum in repeatable data patterns.`,
        insights: reportSeed.insights,
        recommendations: reportSeed.recommendations,
        chartData: reportSeed.chartData,
        metrics: reportSeed.metrics,
        datasetMeta: reportSeed.datasetMeta,
        sampleRows: reportSeed.sampleRows,
        source
      },
      userSeed.reportCount - index
    );
  });

  await Report.insertMany(reports);

  return {
    email: user.email,
    password: userSeed.password,
    plan: user.plan,
    reportsCreated: reports.length
  };
}

async function main() {
  const reset = process.argv.includes("--reset");
  await connectDatabase(env.MONGODB_URI);
  const reportSeed = await loadSeedAnalysis();
  const results = [];

  for (const userSeed of seedUsers) {
    const result = await upsertSeedUser(userSeed, reportSeed, reset);
    results.push(result);
  }

  console.log("InsightForge AI seed complete");
  for (const result of results) {
    console.log(
      `- ${result.email} | plan=${result.plan} | password=${result.password} | reports=${result.reportsCreated}`
    );
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
