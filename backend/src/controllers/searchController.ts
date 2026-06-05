import { searchService } from "../services/searchService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const keywordSearch = asyncHandler(async (req, res) => {
  res.json(await searchService.keyword(String(req.query.q), req.user!.id, Number(req.query.limit ?? 20)));
});

export const vectorSearch = asyncHandler(async (req, res) => {
  res.json(await searchService.vector(req.body.query, req.user!.id, req.body.subjects, req.body.limit));
});
