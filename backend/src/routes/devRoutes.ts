import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getDevDatabaseStatus } from "../services/devDatabaseStatusService.js";

export const devRoutes = Router();

devRoutes.get(
  "/database/status",
  asyncHandler(async (_req, res) => {
    const status = await getDevDatabaseStatus();
    res.status(status.ok ? 200 : 503).json(status);
  })
);
