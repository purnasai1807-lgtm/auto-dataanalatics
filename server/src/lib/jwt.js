import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function signEmailVerificationToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      type: "email_verification"
    },
    env.EMAIL_VERIFICATION_SECRET || env.JWT_SECRET,
    {
      expiresIn: `${env.EMAIL_VERIFICATION_EXPIRES_HOURS}h`
    }
  );
}

export function verifyEmailVerificationToken(token) {
  return jwt.verify(token, env.EMAIL_VERIFICATION_SECRET || env.JWT_SECRET);
}
