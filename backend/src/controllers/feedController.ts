import { feedService } from "../services/feedService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const subjectsFromQuery = (subjects: unknown) =>
  typeof subjects === "string" ? subjects.split(",").map((subject) => subject.trim()).filter(Boolean) : [];

export const getFeed = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  res.json(await feedService.getFeed(req.user!.id, subjectsFromQuery(req.query.subjects), Number.isFinite(limit) ? limit : 20));
});

export const getSnippet = asyncHandler(async (req, res) => {
  res.json(await feedService.getSnippet(req.params.snippetId));
});

export const likeSnippet = asyncHandler(async (req, res) => {
  res.json(await feedService.mark(req.user!.id, req.params.snippetId, "liked"));
});

export const saveSnippet = asyncHandler(async (req, res) => {
  res.json(await feedService.mark(req.user!.id, req.params.snippetId, "saved"));
});

export const reportSnippet = asyncHandler(async (req, res) => {
  res.json(await feedService.mark(req.user!.id, req.params.snippetId, "reported"));
});
