import type { MediaType } from "@shortlearn/shared";
import { AppError } from "./errors.js";

const titleWordLimit = 40;
const descriptionWordLimit = 1500;
const tagLimit = 20;

export const detectMediaType = (mimetype: string, filename = ""): MediaType => {
  const extension = filename.toLowerCase().split(".").pop() ?? "";
  if (mimetype.includes("pdf") || extension === "pdf") return "pdf";
  if (mimetype.startsWith("audio/") || ["mp3", "wav", "m4a", "aac", "flac", "ogg"].includes(extension)) return "audio";
  if (mimetype.startsWith("video/") || ["mp4", "mov", "mkv", "webm"].includes(extension)) return "video";
  if (mimetype.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "tiff"].includes(extension)) return "image";
  if (mimetype.includes("text") || ["txt", "md", "csv", "html", "htm"].includes(extension)) return "text";
  if (mimetype.includes("document") || mimetype.includes("word") || ["doc", "docx", "rtf"].includes(extension)) return "document";
  return "other";
};

export const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);

export const limitWords = (value: string, maxWords: number) => words(value).slice(0, maxWords).join(" ");

export const normalizeTitle = (title: string) => limitWords(title.replace(/\s+/g, " ").trim(), titleWordLimit);

export const normalizeDescription = (description = "") => limitWords(description.replace(/\s+/g, " ").trim(), descriptionWordLimit);

export const normalizeTags = (tags: string[] | string) => {
  const rawTags = Array.isArray(tags) ? tags : tags.split(",");
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of rawTags) {
    const clean = tag.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, " ").trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    normalized.push(clean);
    if (normalized.length >= tagLimit) break;
  }

  return normalized;
};

export const validateMaterialMetadata = (input: { title: string; description?: string; tags: string[] }) => {
  if (words(input.title).length > titleWordLimit) {
    throw new AppError(400, `Title must be ${titleWordLimit} words or fewer`);
  }
  if (words(input.description ?? "").length > descriptionWordLimit) {
    throw new AppError(400, `Description must be ${descriptionWordLimit} words or fewer`);
  }
  if (input.tags.length > tagLimit) {
    throw new AppError(400, `Tags must include ${tagLimit} or fewer comma-separated terms`);
  }
};

export const metadataLimits = {
  titleWordLimit,
  descriptionWordLimit,
  tagLimit
};
