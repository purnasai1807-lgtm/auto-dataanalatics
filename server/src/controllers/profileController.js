import { z } from "zod";
import { getUsageSnapshot } from "../services/usageService.js";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  onboardingCompleted: z.boolean().optional()
});

export async function getProfile(req, res) {
  res.json({
    profile: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      plan: req.user.plan,
      onboardingCompleted: req.user.onboardingCompleted,
      reportsUsed: req.user.reportsUsed,
      totalReportsGenerated: req.user.totalReportsGenerated,
      createdAt: req.user.createdAt
    },
    usage: getUsageSnapshot(req.user)
  });
}

export async function updateProfile(req, res) {
  const input = updateProfileSchema.parse(req.body);

  if (typeof input.name !== "undefined") {
    req.user.name = input.name;
  }

  if (typeof input.onboardingCompleted !== "undefined") {
    req.user.onboardingCompleted = input.onboardingCompleted;
  }

  await req.user.save();

  res.json({
    profile: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      plan: req.user.plan,
      onboardingCompleted: req.user.onboardingCompleted,
      reportsUsed: req.user.reportsUsed,
      totalReportsGenerated: req.user.totalReportsGenerated,
      createdAt: req.user.createdAt
    },
    usage: getUsageSnapshot(req.user)
  });
}
