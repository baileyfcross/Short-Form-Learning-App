import { z } from "zod";
import { env } from "../config/env.js";
import type { ExtractedFactClaim } from "../types/internal.js";

const ollamaFactSchema = z.object({
  facts: z.array(
    z.object({
      claimText: z.string().min(8),
      confidenceScore: z.number().min(0).max(1).default(0.55),
      sourceChunkIndex: z.number().int().min(0).default(0),
      needsVerification: z.boolean().default(true)
    })
  )
});

export interface FactExtractionService {
  extractFacts(chunks: string[]): Promise<ExtractedFactClaim[]>;
}

export class LocalFactExtractionService implements FactExtractionService {
  async extractFacts(chunks: string[]) {
    if (env.OLLAMA_MODEL) {
      const ollamaFacts = await this.tryOllama(chunks);
      if (ollamaFacts.length) return ollamaFacts;
    }

    return this.extractWithRules(chunks);
  }

  private async tryOllama(chunks: string[]): Promise<ExtractedFactClaim[]> {
    try {
      const prompt = [
        "Extract concise educational factual claims from the provided chunks.",
        "Return JSON only with this shape: {\"facts\":[{\"claimText\":\"...\",\"confidenceScore\":0.0,\"sourceChunkIndex\":0,\"needsVerification\":true}]}",
        "Do not include opinions, instructions, or duplicate claims.",
        chunks.map((chunk, index) => `Chunk ${index}: ${chunk}`).join("\n\n")
      ].join("\n\n");

      const response = await fetch(`${env.OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.OLLAMA_MODEL,
          prompt,
          stream: false,
          format: "json",
          options: { temperature: 0.1 }
        })
      });

      if (!response.ok) return [];
      const body = (await response.json()) as { response?: string };
      const parsed = ollamaFactSchema.safeParse(JSON.parse(body.response ?? "{}"));
      return parsed.success ? parsed.data.facts.slice(0, 12) : [];
    } catch {
      return [];
    }
  }

  private extractWithRules(chunks: string[]): ExtractedFactClaim[] {
    const claims: ExtractedFactClaim[] = [];
    const seen = new Set<string>();

    chunks.forEach((chunk, sourceChunkIndex) => {
      const sentences = chunk
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length >= 45 && sentence.length <= 260);

      for (const sentence of sentences) {
        if (!this.looksLikeClaim(sentence)) continue;
        const key = sentence.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        claims.push({
          claimText: sentence,
          confidenceScore: 0.48,
          sourceChunkIndex,
          needsVerification: true
        });
        if (claims.length >= 12) return;
      }
    });

    return claims;
  }

  private looksLikeClaim(sentence: string) {
    const lower = sentence.toLowerCase();
    if (/[?]$/.test(sentence)) return false;
    if (/\b(i|we|you)\b/.test(lower) && !/\b(is|are|was|were|contains|causes|means|refers|formed|created|invented)\b/.test(lower)) return false;
    return /\b(is|are|was|were|contains|causes|means|refers to|formed|created|invented|discovered|increased|decreased|consists|includes)\b/.test(lower);
  }
}

export const factExtractionService = new LocalFactExtractionService();
