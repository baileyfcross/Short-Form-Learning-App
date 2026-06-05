import { adminService } from "../services/adminService.js";
import { libraryService } from "../services/libraryService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getMaterials = asyncHandler(async (_req, res) => {
  res.json(await adminService.materials());
});

export const getPendingSnippets = asyncHandler(async (_req, res) => {
  res.json(await adminService.pendingSnippets());
});

export const approveSnippet = asyncHandler(async (req, res) => {
  res.json(await adminService.moderateSnippet(req.params.id, "approved", req.user!.id));
});

export const rejectSnippet = asyncHandler(async (req, res) => {
  res.json(await adminService.moderateSnippet(req.params.id, "rejected", req.user!.id));
});

export const takeDownSnippet = asyncHandler(async (req, res) => {
  res.json(await adminService.takeDownSnippet(req.params.id, req.user!.id));
});

export const viewSnippetSource = asyncHandler(async (req, res) => {
  const file = await libraryService.getReviewSnippetSourceFileAccess(req.params.id);
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
  res.sendFile(file.filePath);
});

export const updateReliability = asyncHandler(async (req, res) => {
  res.json(await adminService.setReliability(req.params.id, req.body.score));
});

export const getReports = asyncHandler(async (_req, res) => {
  res.json(await adminService.reports());
});

export const updateReport = asyncHandler(async (req, res) => {
  res.json(await adminService.updateReport(req.params.id, req.body.status));
});

export const getUsers = asyncHandler(async (_req, res) => {
  res.json(await adminService.users());
});
