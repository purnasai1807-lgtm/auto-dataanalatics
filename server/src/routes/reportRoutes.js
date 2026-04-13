import { Router } from "express";
import {
  analyzeDemoDataset,
  analyzeUpload,
  downloadReportPdf,
  getDemoPreview,
  getReport,
  listReports
} from "../controllers/reportController.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);
router.post("/analyze", upload.single("file"), asyncHandler(analyzeUpload));
router.post("/demo/analyze", asyncHandler(analyzeDemoDataset));
router.get("/demo/preview", asyncHandler(getDemoPreview));
router.get("/", asyncHandler(listReports));
router.get("/:reportId", asyncHandler(getReport));
router.get("/:reportId/pdf", asyncHandler(downloadReportPdf));

export const reportRouter = router;
