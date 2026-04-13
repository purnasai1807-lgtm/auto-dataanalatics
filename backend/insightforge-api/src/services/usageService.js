import { AppError } from "../lib/appError.js";

const FREE_REPORT_LIMIT = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function normalizeUsageWindow(user) {
  const startedAt = user.usageWindowStartedAt ? new Date(user.usageWindowStartedAt) : new Date();

  if (Date.now() - startedAt.getTime() >= DAY_IN_MS) {
    user.usageWindowStartedAt = new Date();
    user.reportsUsed = 0;
  }
}

export function getUsageSnapshot(user) {
  normalizeUsageWindow(user);

  return {
    plan: user.plan,
    reportsUsed: user.reportsUsed,
    reportsRemaining: user.plan === "pro" ? null : Math.max(FREE_REPORT_LIMIT - user.reportsUsed, 0),
    dailyLimit: user.plan === "pro" ? null : FREE_REPORT_LIMIT,
    totalReportsGenerated: user.totalReportsGenerated ?? 0,
    usageWindowStartedAt: user.usageWindowStartedAt
  };
}

export async function assertReportQuota(user) {
  normalizeUsageWindow(user);

  if (user.plan === "free" && user.reportsUsed >= FREE_REPORT_LIMIT) {
    throw new AppError("You have reached the free plan limit of 3 reports today.", 403, {
      code: "REPORT_LIMIT_REACHED",
      upgradeRequired: true
    });
  }

  await user.save();
}

export async function consumeReportQuota(user) {
  normalizeUsageWindow(user);
  user.reportsUsed += 1;
  user.totalReportsGenerated += 1;
  await user.save();
}
