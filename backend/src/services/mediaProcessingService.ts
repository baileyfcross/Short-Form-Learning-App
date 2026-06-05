import type { Material } from "@shortlearn/shared";
import { graphRepository } from "../db/index.js";
import { documentParsingService } from "./documentParsingService.js";
import { embeddingService } from "./embeddingService.js";
import { factExtractionService } from "./factExtractionService.js";
import { factVerificationService } from "./factVerificationService.js";
import { transcriptionService } from "./transcriptionService.js";

export class MediaProcessingService {
  async processMaterial(material: Material) {
    const extracted =
      material.mediaType === "audio" || material.mediaType === "video"
        ? await transcriptionService.transcribe({
            objectKey: material.objectKey,
            mediaType: material.mediaType,
            title: material.title
          })
        : await documentParsingService.extract({
            objectKey: material.objectKey,
            mediaType: material.mediaType,
            title: material.title
          });

    const chunks = this.chunkText(extracted.text);
    await embeddingService.embedBatch?.(chunks) ?? Promise.all(chunks.map((chunk) => embeddingService.embed(chunk)));

    const facts = await factExtractionService.extractFacts(chunks);
    const primaryClaim = facts[0]?.claimText ?? chunks[0] ?? material.title;
    const verification = await factVerificationService.verifyClaim(primaryClaim);
    const confidenceScore = Math.round(Math.max(verification.confidenceScore, facts[0]?.confidenceScore ?? extracted.confidenceScore) * 100);

    await graphRepository.createSnippet({
      sourceMaterialId: material.id,
      uploaderId: material.ownerId,
      title: `Short lesson from ${material.title}`,
      subject: material.subject,
      tags: material.tags,
      summary: this.buildSummary(primaryClaim, facts.length),
      transcript: extracted.text,
      contentType: material.mediaType === "audio" ? "audio" : material.mediaType === "video" ? "video" : "text",
      objectKey: material.objectKey,
      citation: material.sourceUrl,
      confidenceScore,
      reliabilityScore: 55,
      isPublic: material.isPublic
    });
  }

  private chunkText(text: string) {
    return text.match(/.{1,700}(\s|$)/g)?.map((chunk) => chunk.trim()).filter(Boolean) ?? [text];
  }

  private buildSummary(primaryClaim: string, factCount: number) {
    if (factCount <= 1) return primaryClaim;
    return `${primaryClaim} (${factCount} local fact candidates extracted for review.)`;
  }
}

export const mediaProcessingService = new MediaProcessingService();
