import { Router } from "express";
import {
  deleteMaterial,
  downloadMaterialFile,
  getMaterial,
  inspectUpload,
  listLibrary,
  patchMaterial,
  uploadMaterial,
  viewMaterialFile
} from "../controllers/libraryController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { materialPatchSchema } from "./schemas.js";

export const libraryRoutes = Router();

libraryRoutes.use(requireAuth);
libraryRoutes.get("/", listLibrary);
libraryRoutes.post("/inspect", upload.single("file"), inspectUpload);
libraryRoutes.post("/upload", upload.single("file"), uploadMaterial);
libraryRoutes.get("/:id/view", viewMaterialFile);
libraryRoutes.get("/:id/download", downloadMaterialFile);
libraryRoutes.get("/:id", getMaterial);
libraryRoutes.delete("/:id", deleteMaterial);
libraryRoutes.patch("/:id", validate(materialPatchSchema), patchMaterial);
