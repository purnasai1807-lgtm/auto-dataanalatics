import { Router } from "express";
import {
  createCheckoutSession,
  createPortalSession,
  handleStripeWebhook
} from "../controllers/billingController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/webhook", asyncHandler(handleStripeWebhook));
router.post("/checkout-session", requireAuth, asyncHandler(createCheckoutSession));
router.post("/portal-session", requireAuth, asyncHandler(createPortalSession));

export const billingRouter = router;
