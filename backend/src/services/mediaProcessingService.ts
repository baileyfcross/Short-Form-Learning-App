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

    const latestMaterial = await graphRepository.getMaterialForUser(material.id, material.ownerId, false);
    const snippetMaterial = latestMaterial ?? material;

    await graphRepository.createSnippet({
      sourceMaterialId: snippetMaterial.id,
      uploaderId: snippetMaterial.ownerId,
      title: `Short lesson from ${snippetMaterial.title}`,
      subject: snippetMaterial.subject,
      tags: snippetMaterial.tags,
      summary: this.buildSummary(primaryClaim, facts.length),
      transcript: extracted.text,
      contentType: snippetMaterial.mediaType === "audio" ? "audio" : snippetMaterial.mediaType === "video" ? "video" : "text",
      objectKey: snippetMaterial.objectKey,
      citation: snippetMaterial.sourceUrl,
      confidenceScore,
      reliabilityScore: 55,
      isPublic: snippetMaterial.isPublic
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
