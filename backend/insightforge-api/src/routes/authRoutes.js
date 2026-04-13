import { Router } from "express";
import { login, me, resendVerificationEmail, signup, verifyEmail } from "../controllers/authController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/login", asyncHandler(login));
router.post("/verify-email", asyncHandler(verifyEmail));
router.post("/resend-verification", asyncHandler(resendVerificationEmail));
router.get("/me", requireAuth, asyncHandler(me));

export const authRouter = router;
