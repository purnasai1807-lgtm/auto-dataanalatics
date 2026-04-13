import { Router } from "express";
import { getOverview } from "../controllers/dashboardController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/overview", asyncHandler(getOverview));

export const dashboardRouter = router;
