import { Router } from "express";
import { getFeed, getSnippet, likeSnippet, reportSnippet, saveSnippet } from "../controllers/feedController.js";
import { requireAuth } from "../middleware/auth.js";

export const feedRoutes = Router();

feedRoutes.use(requireAuth);
feedRoutes.get("/", getFeed);
feedRoutes.get("/:snippetId", getSnippet);
feedRoutes.post("/:snippetId/like", likeSnippet);
feedRoutes.post("/:snippetId/save", saveSnippet);
feedRoutes.post("/:snippetId/report", reportSnippet);
