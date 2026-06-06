import { Readable } from "node:stream";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import type { Material } from "@shortlearn/shared";
import { graphRepository } from "../db/index.js";
import { AppError, notFound } from "../utils/errors.js";
import { mediaProcessingService } from "./mediaProcessingService.js";
import { objectStorageService } from "./objectStorageService.js";
import { detectMediaType, normalizeDescription, normalizeTags, normalizeTitle, validateMaterialMetadata } from "../utils/materialMetadata.js";

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
    const metadata = {
      title: normalizeTitle(input.title || input.file.originalname || "Untitled"),
      description: input.description ? normalizeDescription(input.description) : undefined,
      tags: normalizeTags(input.tags)
    };
    validateMaterialMetadata({ title: metadata.title, description: metadata.description, tags: metadata.tags });

    const fileHash = createHash("sha256").update(input.file.buffer).digest("hex");
    const existingMaterial = await graphRepository.findMaterialByOwnerAndFileHash(input.userId, fileHash);
    if (existingMaterial) return existingMaterial;

    const stored = await objectStorageService.putObject({
      stream: Readable.from(input.file.buffer),
      originalName: input.file.originalname,
      contentType: input.file.mimetype,
      size: input.file.size,
      ownerId: input.userId
    });

    const material = await graphRepository.createMaterial({
      ownerId: input.userId,
      title: metadata.title,
      description: metadata.description,
      subject: input.subject,
      tags: metadata.tags,
      isPublic: input.isPublic,
      mediaType: detectMediaType(input.file.mimetype, input.file.originalname),
      objectKey: stored.objectKey,
      sourceUrl: stored.url,
      originalName: input.file.originalname,
      fileHash,
      fileSize: input.file.size,
      contentType: input.file.mimetype
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

  async getFileAccess(id: string, userId: string, isAdmin: boolean) {
    const material = await this.get(id, userId, isAdmin);
    return this.fileAccessForMaterial(material);
  }

  async getPublicSnippetSourceFileAccess(snippetId: string) {
    const material = await graphRepository.getApprovedSnippetSourceMaterial(snippetId);
    if (!material) throw notFound("Approved source material");
    return this.fileAccessForMaterial(material);
  }

  async getReviewSnippetSourceFileAccess(snippetId: string) {
    const material = await graphRepository.getReviewSnippetSourceMaterial(snippetId);
    if (!material) throw notFound("Review source material");
    return this.fileAccessForMaterial(material);
  }

  private fileAccessForMaterial(material: Material) {
    if (!objectStorageService.resolveObjectPath) {
      throw new AppError(501, "Direct local file access is not available for this storage provider");
    }

    const filePath = objectStorageService.resolveObjectPath(material.objectKey);
    if (!existsSync(filePath)) throw notFound("Stored file");

    return {
      material,
      filePath,
      filename: this.filenameForMaterial(material),
      contentType: this.contentTypeForMaterial(material)
    };
  }

  async patch(id: string, userId: string, patch: Partial<Material>) {
    const material = await graphRepository.patchMaterial(id, userId, patch);
    if (!material) throw notFound("Material");
    return material;
  }

  async remove(id: string, userId: string) {
    const material = await this.get(id, userId, false);
    if (material.ownerId !== userId) {
      const removed = await graphRepository.removeSavedMaterialForUser(id, userId);
      if (!removed) throw notFound("Saved material");
      return;
    }

    const deleted = await graphRepository.deleteMaterial(id, userId, false);
    if (!deleted) throw notFound("Material");
    await objectStorageService.deleteObject(material.objectKey);
  }

  private filenameForMaterial(material: Material) {
    const safeTitle = material.title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "material";
    const extension = material.objectKey.split(".").pop();
    return extension && extension.length <= 8 ? `${safeTitle}.${extension}` : safeTitle;
  }

  private contentTypeForMaterial(material: Material) {
    if (material.mediaType === "pdf") return "application/pdf";
    if (material.mediaType === "audio") return "audio/mpeg";
    if (material.mediaType === "video") return "video/mp4";
    if (material.mediaType === "image") return "image/*";
    if (material.mediaType === "text") return "text/plain; charset=utf-8";
    return "application/octet-stream";
  }
}

export const libraryService = new LibraryService();
