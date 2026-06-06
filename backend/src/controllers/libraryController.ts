import { libraryService } from "../services/libraryService.js";
import { uploadInspectionService } from "../services/uploadInspectionService.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { canReviewMaterials, isAdmin } from "../middleware/roles.js";
import { normalizeTags } from "../utils/materialMetadata.js";
import { AppError } from "../utils/errors.js";

const parseTags = (value: unknown) => {
  if (Array.isArray(value)) return normalizeTags(value.map(String));
  if (typeof value === "string") return normalizeTags(value);
  return [];
};

export const listLibrary = asyncHandler(async (req, res) => {
  res.json(await libraryService.list(req.user!.id));
});

export const uploadMaterial = asyncHandler(async (req, res) => {
  res.status(201).json(
    await libraryService.upload({
      userId: req.user!.id,
      file: req.file!,
      title: String(req.body.title ?? req.file?.originalname ?? "Untitled"),
      description: req.body.description ? String(req.body.description) : undefined,
      subject: String(req.body.subject ?? "General"),
      tags: parseTags(req.body.tags),
      isPublic: req.body.isPublic === "true" || req.body.isPublic === true
    })
  );
});

export const inspectUpload = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "File is required");
  res.json(await uploadInspectionService.inspect(req.file!));
});

export const getMaterial = asyncHandler(async (req, res) => {
  res.json(await libraryService.get(req.params.id, req.user!.id, isAdmin(req)));
});

export const viewMaterialFile = asyncHandler(async (req, res) => {
  const file = await libraryService.getFileAccess(req.params.id, req.user!.id, canReviewMaterials(req));
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.filename)}"`);
  res.sendFile(file.filePath);
});

export const downloadMaterialFile = asyncHandler(async (req, res) => {
  const file = await libraryService.getFileAccess(req.params.id, req.user!.id, isAdmin(req));
  res.download(file.filePath, file.filename);
});

export const patchMaterial = asyncHandler(async (req, res) => {
  res.json(await libraryService.patch(req.params.id, req.user!.id, req.body));
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  await libraryService.remove(req.params.id, req.user!.id);
  res.status(204).send();
});
