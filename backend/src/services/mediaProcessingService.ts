import type { Material } from "@shortlearn/shared";
import { graphRepository } from "../db/index.js";
import { embeddingService } from "./embeddingService.js";
import { factVerificationService } from "./factVerificationService.js";
import { transcriptionService } from "./transcriptionService.js";

export class MediaProcessingService {
  async processMaterial(material: Material) {
    const transcript = await transcriptionService.transcribe({
      objectKey: material.objectKey,
      mediaType: material.mediaType,
      title: material.title
    });

    const chunks = this.chunkText(transcript.text);
    await Promise.all(chunks.map((chunk) => embeddingService.embed(chunk)));
    const verification = await factVerificationService.verifyClaim(chunks[0] ?? material.title);

    await graphRepository.createSnippet({
      sourceMaterialId: material.id,
      uploaderId: material.ownerId,
      title: `Short lesson from ${material.title}`,
      subject: material.subject,
      tags: material.tags,
      summary: chunks[0] ?? material.title,
      transcript: transcript.text,
      contentType: material.mediaType === "audio" ? "audio" : material.mediaType === "video" ? "video" : "text",
      objectKey: material.objectKey,
      citation: material.sourceUrl,
      confidenceScore: Math.round(verification.confidenceScore * 100),
      reliabilityScore: 55,
      isPublic: material.isPublic
    });
  }

  private chunkText(text: string) {
    return text.match(/.{1,700}(\s|$)/g)?.map((chunk) => chunk.trim()).filter(Boolean) ?? [text];
  }
}

export const mediaProcessingService = new MediaProcessingService();
