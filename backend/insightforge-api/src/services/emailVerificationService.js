import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";
import { signEmailVerificationToken, verifyEmailVerificationToken } from "../lib/jwt.js";

let cachedTransporter = null;

function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);
}

export function isEmailVerificationEnabled() {
  return Boolean(env.REQUIRE_EMAIL_VERIFICATION || isSmtpConfigured());
}

export function requiresEmailVerification(user) {
  return Boolean(user?.emailVerificationRequired === true && !user?.emailVerifiedAt);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined
    });
  }

  return cachedTransporter;
}

function buildVerificationUrl(token) {
  return `${env.APP_URL.replace(/\/$/, "")}/workspace/verify-email?token=${encodeURIComponent(token)}`;
}

function ensureDeliveryAvailable() {
  if (isSmtpConfigured()) {
    return;
  }

  if (env.NODE_ENV === "production") {
    throw new AppError("Email verification is not configured yet. Please add SMTP credentials.", 503);
  }
}

export async function sendVerificationEmail(user) {
  ensureDeliveryAvailable();

  const token = signEmailVerificationToken(user);
  const verificationUrl = buildVerificationUrl(token);
  const transporter = getTransporter();

  if (!transporter) {
    console.info(`InsightForge AI verification link for ${user.email}: ${verificationUrl}`);
    return { verificationUrl };
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: user.email,
    replyTo: env.SMTP_REPLY_TO || undefined,
    subject: "Verify your InsightForge AI email",
    text: [
      `Hi ${user.name},`,
      "",
      "Verify your email to activate your InsightForge AI account:",
      verificationUrl,
      "",
      `This link expires in ${env.EMAIL_VERIFICATION_EXPIRES_HOURS} hours.`
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a">
        <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#475569;font-weight:700">InsightForge AI</div>
        <h1 style="font-size:28px;line-height:1.2;margin:16px 0 12px">Verify your email address</h1>
        <p style="font-size:16px;line-height:1.7;margin:0 0 18px">Hi ${user.name}, click the button below to activate your account and start generating verified analytics reports.</p>
        <a href="${verificationUrl}" style="display:inline-block;padding:14px 20px;border-radius:14px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700">Verify email</a>
        <p style="font-size:14px;line-height:1.7;margin:18px 0 0;color:#475569">If the button does not work, copy and paste this link into your browser:</p>
        <p style="font-size:14px;line-height:1.7;word-break:break-all;color:#0f172a">${verificationUrl}</p>
        <p style="font-size:14px;line-height:1.7;color:#475569">This link expires in ${env.EMAIL_VERIFICATION_EXPIRES_HOURS} hours.</p>
      </div>
    `
  });

  return { verificationUrl };
}

export function decodeEmailVerificationToken(token) {
  try {
    const payload = verifyEmailVerificationToken(token);

    if (payload?.type !== "email_verification") {
      throw new Error("Invalid token type.");
    }

    return payload;
  } catch {
    throw new AppError("This verification link is invalid or has expired.", 400);
  }
}
