import express from "express";
import { pinoHttp } from "pino-http";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { applySecurityMiddleware } from "./middleware/security.js";
import { devLoginMiddleware } from "./middleware/devLogin.js";

export const createApp = () => {
  const app = express();
  applySecurityMiddleware(app);
  app.use(pinoHttp());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(devLoginMiddleware);

  app.use("/api", apiRoutes);
  app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
  app.use(errorHandler);
  return app;
};
