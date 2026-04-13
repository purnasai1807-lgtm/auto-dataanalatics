import multer from "multer";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../lib/appError.js";

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed.",
      details: error.flatten()
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      message: "Database validation failed.",
      details: Object.values(error.errors).map((item) => item.message)
    });
    return;
  }

  if (error?.code === 11000) {
    res.status(409).json({
      message: "A record with that value already exists."
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE" ? "The uploaded file exceeds the size limit." : error.message
    });
    return;
  }

  const statusCode = error instanceof AppError ? error.statusCode : error.statusCode || 500;
  const message = error instanceof AppError ? error.message : error.message || "Internal server error.";

  res.status(statusCode).json({
    message,
    details: error instanceof AppError ? error.details : error.details || null
  });
}
