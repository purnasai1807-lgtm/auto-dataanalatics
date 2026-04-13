import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(getProfile));
router.patch("/", asyncHandler(updateProfile));

export const profileRouter = router;
