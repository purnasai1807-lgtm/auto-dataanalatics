import { User } from "../models/User.js";
import { AppError } from "../lib/appError.js";
import { verifyToken } from "../lib/jwt.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    next(new AppError("Authentication required.", 401));
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      next(new AppError("User not found.", 401));
      return;
    }

    req.user = user;
    next();
  } catch {
    next(new AppError("Invalid or expired token.", 401));
  }
}

export function requirePlan(plan) {
  return function enforcePlan(req, res, next) {
    if (!req.user) {
      next(new AppError("Authentication required.", 401));
      return;
    }

    if (req.user.plan !== plan) {
      next(new AppError(`This feature requires the ${plan} plan.`, 403));
      return;
    }

    next();
  };
}
