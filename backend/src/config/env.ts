import "dotenv/config";
import { z } from "zod";

const booleanEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    API_ORIGIN: z.string().default("http://localhost:5173,http://localhost:4173"),
    JWT_ACCESS_SECRET: z.string().min(24).default("dev-access-secret-change-before-production"),
    JWT_REFRESH_SECRET: z.string().min(24).default("dev-refresh-secret-change-before-production"),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    REFRESH_TOKEN_TTL: z.string().default("7d"),
    GRAPH_MODE: z.enum(["memory", "neo4j"]).default("memory"),
    NEO4J_URI: z.string().default("neo4j://localhost:7687"),
    NEO4J_USERNAME: z.string().default("neo4j"),
    NEO4J_PASSWORD: z.string().default("password"),
    OBJECT_STORAGE_PROVIDER: z.enum(["local", "s3-compatible"]).default("local"),
    LOCAL_STORAGE_DIR: z.string().default("backend/storage"),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().default(100),
    RELIABILITY_MIN_PUBLIC: z.coerce.number().min(0).max(100).default(60),
    EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(384),
    FFMPEG_BINARY: z.string().default("ffmpeg"),
    WHISPER_BINARY: z.string().default(""),
    WHISPER_MODEL_PATH: z.string().default(""),
    TESSERACT_BINARY: z.string().default("tesseract"),
    OLLAMA_URL: z.string().url().default("http://localhost:11434"),
    OLLAMA_MODEL: z.string().default(""),
    SEED_DEMO_USERS: booleanEnv,
    DEV_LOGIN_ENABLED: booleanEnv,
    DEMO_USER_PASSWORD: z.string().min(12).default("ChangeMe12345")
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && value.DEV_LOGIN_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DEV_LOGIN_ENABLED"],
        message: "DEV_LOGIN_ENABLED must be false in production."
      });
    }
  });

export const env = envSchema.parse(process.env);
