import { readFile } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import type { Material } from "@shortlearn/shared";
import { env } from "../config/env.js";
import type { ExtractedContent } from "../types/internal.js";
import { runLocalCommand } from "../utils/localProcess.js";
import { objectStorageService } from "./objectStorageService.js";

export interface DocumentParsingService {
  extract(input: { objectKey: string; mediaType: Material["mediaType"]; title: string }): Promise<ExtractedContent>;
}

export class LocalDocumentParsingService implements DocumentParsingService {
  async extract(input: { objectKey: string; mediaType: Material["mediaType"]; title: string }): Promise<ExtractedContent> {
    const filePath = this.resolvePath(input.objectKey);

    if (input.mediaType === "pdf") return this.extractPdf(filePath);
    if (input.mediaType === "document") return this.extractDocument(filePath);
    if (input.mediaType === "text") return this.extractText(filePath);
    if (input.mediaType === "image") return this.extractImageText(filePath);

    return {
      text: `No local parser is configured for ${input.mediaType} material "${input.title}".`,
      confidenceScore: 0.2,
      provider: "local-parser-fallback",
      warnings: [`Unsupported parser media type: ${input.mediaType}`]
    };
  }

  private async extractPdf(filePath: string): Promise<ExtractedContent> {
    const pdfParse = (await import("pdf-parse")).default;
    const buffer = await readFile(filePath);
    const result = await pdfParse(buffer);
    const text = this.normalizeText(result.text);

    return {
      text,
      confidenceScore: text.length > 200 ? 0.86 : 0.45,
      provider: "pdf-parse",
      warnings: text.length > 40 ? [] : ["PDF text layer was sparse. This may be a scanned PDF that needs OCR."]
    };
  }

  private async extractDocument(filePath: string): Promise<ExtractedContent> {
    if (path.extname(filePath).toLowerCase() === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: this.normalizeText(result.value),
        confidenceScore: result.value.length > 100 ? 0.84 : 0.5,
        provider: "mammoth",
        warnings: result.messages.map((message) => message.message)
      };
    }

    return this.extractText(filePath);
  }

  private async extractText(filePath: string): Promise<ExtractedContent> {
    const raw = await readFile(filePath, "utf8");
    const isHtml = [".html", ".htm"].includes(path.extname(filePath).toLowerCase());
    const text = isHtml ? raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ") : raw;

    return {
      text: this.normalizeText(text),
      confidenceScore: 0.8,
      provider: isHtml ? "local-html-stripper" : "node-fs",
      warnings: []
    };
  }

  private async extractImageText(filePath: string): Promise<ExtractedContent> {
    try {
      const { stdout } = await runLocalCommand(env.TESSERACT_BINARY, [filePath, "stdout"], { timeoutMs: 180_000 });
      const text = this.normalizeText(stdout);
      return {
        text,
        confidenceScore: text.length > 40 ? 0.68 : 0.3,
        provider: "tesseract-cli",
        warnings: text.length > 40 ? [] : ["Tesseract returned little text."]
      };
    } catch (error) {
      return {
        text: "",
        confidenceScore: 0,
        provider: "tesseract-cli",
        warnings: [`Tesseract OCR failed or is not installed: ${error instanceof Error ? error.message : "unknown error"}`]
      };
    }
  }

  private resolvePath(objectKey: string) {
    if (!objectStorageService.resolveObjectPath) {
      throw new Error("Local parsing requires object storage with filesystem path resolution.");
    }
    return objectStorageService.resolveObjectPath(objectKey);
  }

  private normalizeText(text: string) {
    return text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }
}

export const documentParsingService = new LocalDocumentParsingService();
