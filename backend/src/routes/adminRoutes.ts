import { Router } from "express";
import {
  approveSnippet,
  getMaterials,
  getPendingSnippets,
  getReports,
  getUsers,
  rejectSnippet,
  takeDownSnippet,
  updateReliability,
  updateReport,
  viewSnippetSource
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";
import { reliabilitySchema, reportStatusSchema } from "./schemas.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole("admin", "moderator"));
adminRoutes.get("/materials", getMaterials);
adminRoutes.get("/snippets/pending", getPendingSnippets);
adminRoutes.patch("/snippets/:id/approve", approveSnippet);
adminRoutes.patch("/snippets/:id/reject", rejectSnippet);
adminRoutes.patch("/snippets/:id/takedown", requireRole("admin"), takeDownSnippet);
adminRoutes.get("/snippets/:id/source", viewSnippetSource);
adminRoutes.patch("/sources/:id/reliability", requireRole("admin"), validate(reliabilitySchema), updateReliability);
adminRoutes.get("/reports", getReports);
adminRoutes.patch("/reports/:id", validate(reportStatusSchema), updateReport);
adminRoutes.get("/users", requireRole("admin"), getUsers);
