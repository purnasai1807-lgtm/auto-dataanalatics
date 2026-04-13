import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().optional().default(""),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  EMAIL_VERIFICATION_SECRET: z.string().optional().default(""),
  EMAIL_VERIFICATION_EXPIRES_HOURS: z.coerce.number().positive().default(24),
  REQUIRE_EMAIL_VERIFICATION: z.preprocess((value) => parseBoolean(value, false), z.boolean()).default(false),
  CLIENT_URL: z.string().url(),
  APP_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().positive().default(587),
  SMTP_SECURE: z.preprocess((value) => parseBoolean(value, false), z.boolean()).default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default(""),
  SMTP_REPLY_TO: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PRO_PRICE_ID: z.string().optional().default(""),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(8),
  DEMO_DATASET_PATH: z.string().default("./sample-data/retail_sales_sample.csv"),
  DATA_FILE_PATH: z.string().default("./data/insightforge-store.json")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = parsed.data;
