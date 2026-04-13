import { Report } from "../models/Report.js";
import { getUsageSnapshot } from "../services/usageService.js";

export async function getOverview(req, res) {
  const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
  const allReports = await Report.find({ userId: req.user.id }).sort({ createdAt: 1 });

  const totalReports = allReports.length;
  const latestReport = reports[0] ?? null;
  const reportTimeline = allReports.map((report, index) => ({
    label: new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: index + 1
  }));

  res.json({
    stats: {
      totalReports,
      totalReportsGenerated: req.user.totalReportsGenerated,
      currentPlan: req.user.plan,
      latestSummary: latestReport?.summary ?? "Upload a dataset to unlock your first executive-ready report."
    },
    usage: getUsageSnapshot(req.user),
    reportTimeline,
    recentReports: reports.map((report) => ({
      id: report.id,
      fileName: report.fileName,
      summary: report.summary,
      createdAt: report.createdAt,
      source: report.source
    }))
  });
}
