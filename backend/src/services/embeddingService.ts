export interface EmbeddingService {
  embed(text: string): Promise<number[]>;
}

export class MockEmbeddingService implements EmbeddingService {
  async embed(text: string) {
    const vector = new Array(32).fill(0);
    for (let i = 0; i < text.length; i += 1) {
      vector[i % vector.length] += text.charCodeAt(i) / 1000;
    }
    return vector;
  }
}

export const embeddingService = new MockEmbeddingService();
