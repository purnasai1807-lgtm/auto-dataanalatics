import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { billingRouter } from "./routes/billingRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { profileRouter } from "./routes/profileRoutes.js";
import { reportRouter } from "./routes/reportRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((item) => item.trim()),
      credentials: true
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "InsightForge AI API"
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/reports", reportRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/billing", billingRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
