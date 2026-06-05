import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
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
  RELIABILITY_MIN_PUBLIC: z.coerce.number().min(0).max(100).default(60)
});

export const env = envSchema.parse(process.env);
