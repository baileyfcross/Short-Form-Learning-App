import { createHash } from "node:crypto";
import { env } from "../config/env.js";

export interface EmbeddingService {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
}

export class LocalHashEmbeddingService implements EmbeddingService {
  async embed(text: string) {
    const vector = new Array(env.EMBEDDING_DIMENSIONS).fill(0);
    const tokens = this.tokenize(text);

    for (const token of tokens) {
      const hash = createHash("sha256").update(token).digest();
      const index = hash.readUInt32BE(0) % vector.length;
      const sign = hash[4] % 2 === 0 ? 1 : -1;
      vector[index] += sign * (1 + Math.log1p(token.length));
    }

    return this.normalize(vector);
  }

  async embedBatch(texts: string[]) {
    return Promise.all(texts.map((text) => this.embed(text)));
  }

  private tokenize(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  private normalize(vector: number[]) {
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (!magnitude) return vector;
    return vector.map((value) => Number((value / magnitude).toFixed(8)));
  }
}

export const embeddingService: EmbeddingService = new LocalHashEmbeddingService();
