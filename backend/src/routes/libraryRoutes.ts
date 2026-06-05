import { Router } from "express";
import { deleteMaterial, getMaterial, listLibrary, patchMaterial, uploadMaterial } from "../controllers/libraryController.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { materialPatchSchema } from "./schemas.js";

export const libraryRoutes = Router();

libraryRoutes.use(requireAuth);
libraryRoutes.get("/", listLibrary);
libraryRoutes.post("/upload", upload.single("file"), uploadMaterial);
libraryRoutes.get("/:id", getMaterial);
libraryRoutes.delete("/:id", deleteMaterial);
libraryRoutes.patch("/:id", validate(materialPatchSchema), patchMaterial);
