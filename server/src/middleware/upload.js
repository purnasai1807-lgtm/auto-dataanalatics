import multer from "multer";
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";

const allowedExtensions = new Set([".csv", ".xlsx"]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.has(extension)) {
      cb(new AppError("Only CSV and XLSX files are supported.", 400));
      return;
    }

    cb(null, true);
  }
});
