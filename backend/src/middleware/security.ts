import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { Express } from "express";
import { env } from "../config/env.js";

export const applySecurityMiddleware = (app: Express) => {
  app.use(helmet());
  const allowedOrigins = env.API_ORIGIN.split(",").map((origin) => origin.trim());
  app.use(cors({ origin: allowedOrigins, credentials: true, exposedHeaders: ["Content-Disposition"] }));

  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 50,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use(
    "/api/library/upload",
    rateLimit({
      windowMs: 60 * 60 * 1000,
      limit: 30,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
};
