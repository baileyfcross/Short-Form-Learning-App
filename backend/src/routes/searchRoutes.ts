import { Router } from "express";
import { keywordSearch, vectorSearch } from "../controllers/searchController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { querySearchSchema, vectorSearchSchema } from "./schemas.js";

export const searchRoutes = Router();

searchRoutes.use(requireAuth);
searchRoutes.get("/", validate(querySearchSchema, "query"), keywordSearch);
searchRoutes.post("/vector", validate(vectorSearchSchema), vectorSearch);
