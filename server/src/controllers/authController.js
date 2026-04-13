import { z } from "zod";
import { AppError } from "../lib/appError.js";
import { signToken } from "../lib/jwt.js";
import { User } from "../models/User.js";
import { getUsageSnapshot } from "../services/usageService.js";

const signupSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    reportsUsed: user.reportsUsed,
    totalReportsGenerated: user.totalReportsGenerated,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt
  };
}

function authPayload(user) {
  return {
    token: signToken(user.id),
    user: serializeUser(user),
    usage: getUsageSnapshot(user)
  };
}

export async function signup(req, res) {
  const input = signupSchema.parse(req.body);
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("An account with that email already exists.", 409);
  }

  const user = await User.create({
    ...input,
    email: input.email.toLowerCase()
  });

  res.status(201).json(authPayload(user));
}

export async function login(req, res) {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isValidPassword = await user.comparePassword(input.password);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password.", 401);
  }

  res.json(authPayload(user));
}

export async function me(req, res) {
  res.json({
    user: serializeUser(req.user),
    usage: getUsageSnapshot(req.user)
  });
}
