import { Readable } from "node:stream";
import type { Material, MediaType } from "@shortlearn/shared";
import { graphRepository } from "../db/index.js";
import { AppError, notFound } from "../utils/errors.js";
import { mediaProcessingService } from "./mediaProcessingService.js";
import { objectStorageService } from "./objectStorageService.js";

export class LibraryService {
  async list(userId: string) {
    return graphRepository.listMaterialsForUser(userId);
  }

  async upload(input: {
    userId: string;
    file: Express.Multer.File;
    title: string;
    description?: string;
    subject: string;
    tags: string[];
    isPublic: boolean;
  }) {
    if (!input.file) throw new AppError(400, "File is required");
    const stored = await objectStorageService.putObject({
      stream: Readable.from(input.file.buffer),
      originalName: input.file.originalname,
      contentType: input.file.mimetype,
      size: input.file.size,
      ownerId: input.userId
    });

    const material = await graphRepository.createMaterial({
      ownerId: input.userId,
      title: input.title,
      description: input.description,
      subject: input.subject,
      tags: input.tags,
      isPublic: input.isPublic,
      mediaType: this.detectMediaType(input.file.mimetype),
      objectKey: stored.objectKey,
      sourceUrl: stored.url
    });

    void mediaProcessingService.processMaterial(material).catch((error) => {
      console.error("media processing failed", { materialId: material.id, error });
    });

    return material;
  }

  async get(id: string, userId: string, isAdmin: boolean) {
    const material = await graphRepository.getMaterialForUser(id, userId, isAdmin);
    if (!material) throw notFound("Material");
    return material;
  }

  async patch(id: string, userId: string, patch: Partial<Material>) {
    const material = await graphRepository.patchMaterial(id, userId, patch);
    if (!material) throw notFound("Material");
    return material;
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const deleted = await graphRepository.deleteMaterial(id, userId, isAdmin);
    if (!deleted) throw notFound("Material");
  }

  private detectMediaType(mimetype: string): MediaType {
    if (mimetype.includes("pdf")) return "pdf";
    if (mimetype.startsWith("audio/")) return "audio";
    if (mimetype.startsWith("video/")) return "video";
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype.includes("text")) return "text";
    if (mimetype.includes("document") || mimetype.includes("word")) return "document";
    return "other";
  }
}

export const libraryService = new LibraryService();
