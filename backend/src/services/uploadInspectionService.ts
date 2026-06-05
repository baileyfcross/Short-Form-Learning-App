import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { UploadInspection } from "@shortlearn/shared";
import { documentParsingService } from "./documentParsingService.js";
import { detectMediaType, limitWords, normalizeDescription, normalizeTags, normalizeTitle } from "../utils/materialMetadata.js";

const stopWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "because",
  "been",
  "but",
  "can",
  "from",
  "has",
  "have",
  "into",
  "its",
  "more",
  "that",
  "the",
  "their",
  "this",
  "through",
  "used",
  "was",
  "were",
  "when",
  "which",
  "with",
  "your"
]);

export class UploadInspectionService {
  async inspect(file: Express.Multer.File): Promise<UploadInspection> {
    const mediaType = detectMediaType(file.mimetype, file.originalname);
    const fallbackTitle = normalizeTitle(this.titleFromFilename(file.originalname));
    const workDir = await mkdtemp(path.join(tmpdir(), "shortlearn-inspect-"));
    const filePath = path.join(workDir, file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));

    try {
      await writeFile(filePath, file.buffer);
      if (["pdf", "document", "text", "image"].includes(mediaType)) {
        const extracted = await documentParsingService.extractFile({ filePath, mediaType, title: fallbackTitle });
        return this.fromExtractedText({
          text: extracted.text,
          provider: extracted.provider,
          confidenceScore: extracted.confidenceScore,
          warnings: extracted.warnings,
          parserTitle: extracted.title,
          fallbackTitle,
          mediaType
        });
      }

      return {
        title: fallbackTitle,
        description: this.describeMediaFile(mediaType, file.originalname),
        subject: this.subjectFromText(file.originalname),
        tags: this.tagsFromText(file.originalname),
        mediaType,
        confidenceScore: 0.35,
        provider: "filename-inspector",
        warnings: mediaType === "audio" || mediaType === "video" ? ["Audio/video metadata inspection does not transcribe the file. Full transcription runs after upload when Whisper is configured."] : []
      };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private fromExtractedText(input: {
    text: string;
    provider: string;
    confidenceScore: number;
    warnings: string[];
    parserTitle?: string;
    fallbackTitle: string;
    mediaType: UploadInspection["mediaType"];
  }): UploadInspection {
    const title = normalizeTitle(input.parserTitle || this.titleFromText(input.text) || input.fallbackTitle);
    const description = normalizeDescription(this.descriptionFromText(input.text));
    const subject = this.subjectFromText(`${title} ${description}`);
    const tags = this.tagsFromText(`${title} ${description}`);

    return {
      title,
      description,
      subject,
      tags,
      mediaType: input.mediaType,
      confidenceScore: input.confidenceScore,
      provider: input.provider,
      warnings: input.warnings
    };
  }

  private titleFromFilename(filename: string) {
    const base = filename.replace(/\.[^.]+$/, "");
    return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Untitled material";
  }

  private titleFromText(text: string) {
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const titleLine = lines.find((line) => /^title[:\s]/i.test(line));
    if (titleLine) return titleLine.replace(/^title[:\s-]*/i, "");
    return lines.find((line) => {
      const wordCount = line.split(/\s+/).length;
      return wordCount >= 3 && wordCount <= 40 && !/[.!?]$/.test(line);
    });
  }

  private descriptionFromText(text: string) {
    const clean = text.replace(/\s+/g, " ").trim();
    const sentences = clean.match(/[^.!?]+[.!?]+/g)?.slice(0, 5).join(" ") ?? clean;
    return limitWords(sentences, 1500);
  }

  private tagsFromText(text: string) {
    const counts = new Map<string, number>();
    const tokens = text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? [];

    for (const token of tokens) {
      if (stopWords.has(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    return normalizeTags(
      [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 20)
        .map(([tag]) => tag)
    );
  }

  private subjectFromText(text: string) {
    const lower = text.toLowerCase();
    const scores = {
      Science: this.countMatches(lower, ["biology", "chemistry", "physics", "cell", "cells", "energy", "matter", "experiment", "planet", "organism"]),
      Language: this.countMatches(lower, ["grammar", "phrase", "vocabulary", "translation", "language", "verb", "noun", "speaking", "pronunciation"]),
      History: this.countMatches(lower, ["history", "war", "empire", "ancient", "century", "revolution", "king", "queen", "civilization", "archive"]),
      "Creative Arts": this.countMatches(lower, ["art", "music", "painting", "drawing", "design", "poetry", "creative", "theater", "film", "composition"])
    };

    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[1] ? Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] : "Science";
  }

  private countMatches(text: string, terms: string[]) {
    return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
  }

  private describeMediaFile(mediaType: UploadInspection["mediaType"], filename: string) {
    if (mediaType === "audio") return `Audio material selected from ${filename}. Add learning goals, transcript notes, or source context before uploading.`;
    if (mediaType === "video") return `Video material selected from ${filename}. Add learning goals, transcript notes, or source context before uploading.`;
    return `Material selected from ${filename}. Add context before uploading.`;
  }
}

export const uploadInspectionService = new UploadInspectionService();
