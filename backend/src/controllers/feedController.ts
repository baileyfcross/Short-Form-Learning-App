import { feedService } from "../services/feedService.js";
import { libraryService } from "../services/libraryService.js";
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

export const viewSnippetSource = asyncHandler(async (req, res) => {
  const file = await libraryService.getPublicSnippetSourceFileAccess(req.params.snippetId);
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
  res.sendFile(file.filePath);
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
