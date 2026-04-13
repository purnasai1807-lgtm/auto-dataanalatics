import { z } from "zod";
import { AppError } from "../lib/appError.js";
import { signToken } from "../lib/jwt.js";
import { User } from "../models/User.js";
import {
  decodeEmailVerificationToken,
  isEmailVerificationEnabled,
  requiresEmailVerification,
  sendVerificationEmail
} from "../services/emailVerificationService.js";
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

const verifyEmailSchema = z.object({
  token: z.string().min(20)
});

const resendVerificationSchema = z.object({
  email: z.string().email()
});

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: !requiresEmailVerification(user),
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

function verificationResponse(user) {
  return {
    message: "Check your inbox to verify your email before signing in.",
    verificationRequired: true,
    email: user.email
  };
}

export async function signup(req, res) {
  const input = signupSchema.parse(req.body);
  const normalizedEmail = input.email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError(
      requiresEmailVerification(existingUser)
        ? "An account with that email already exists. Verify your email or request another verification link."
        : "An account with that email already exists.",
      409,
      requiresEmailVerification(existingUser)
        ? {
            verificationRequired: true,
            email: existingUser.email
          }
        : null
    );
  }

  const emailVerificationEnabled = isEmailVerificationEnabled();
  const user = await User.create({
    ...input,
    email: normalizedEmail,
    emailVerificationRequired: emailVerificationEnabled,
    emailVerifiedAt: emailVerificationEnabled ? null : new Date(),
    verificationEmailSentAt: null
  });

  if (!emailVerificationEnabled) {
    res.status(201).json(authPayload(user));
    return;
  }

  try {
    await sendVerificationEmail(user);
    user.verificationEmailSentAt = new Date();
    await user.save();
  } catch (error) {
    await User.deleteOne({ _id: user.id });
    throw error instanceof AppError
      ? error
      : new AppError("We couldn't send the verification email right now. Please try again in a moment.", 503);
  }

  res.status(201).json(verificationResponse(user));
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

  if (requiresEmailVerification(user)) {
    throw new AppError("Please verify your email before signing in.", 403, {
      verificationRequired: true,
      email: user.email
    });
  }

  res.json(authPayload(user));
}

export async function me(req, res) {
  res.json({
    user: serializeUser(req.user),
    usage: getUsageSnapshot(req.user)
  });
}

export async function verifyEmail(req, res) {
  const input = verifyEmailSchema.parse(req.body);
  const payload = decodeEmailVerificationToken(input.token);
  const user = await User.findById(payload.sub);

  if (!user || user.email.toLowerCase() !== String(payload.email).toLowerCase()) {
    throw new AppError("This verification link is invalid or has expired.", 400);
  }

  if (!requiresEmailVerification(user)) {
    res.json({
      message: "Your email is already verified. You can sign in now.",
      verified: true,
      email: user.email
    });
    return;
  }

  user.emailVerificationRequired = false;
  user.emailVerifiedAt = new Date();
  await user.save();

  res.json({
    message: "Your email has been verified. You can sign in now.",
    verified: true,
    email: user.email
  });
}

export async function resendVerificationEmail(req, res) {
  const input = resendVerificationSchema.parse(req.body);
  const normalizedEmail = input.email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !requiresEmailVerification(user)) {
    res.json({
      message: "If an account requires verification, a new verification email has been sent.",
      email: normalizedEmail
    });
    return;
  }

  const lastSentAt = user.verificationEmailSentAt ? new Date(user.verificationEmailSentAt).getTime() : 0;

  if (lastSentAt && Date.now() - lastSentAt < 60 * 1000) {
    throw new AppError("Please wait a minute before requesting another verification email.", 429);
  }

  await sendVerificationEmail(user);
  user.verificationEmailSentAt = new Date();
  await user.save();

  res.json({
    message: "If an account requires verification, a new verification email has been sent.",
    email: normalizedEmail
  });
}
