export interface TranscriptionService {
  transcribe(input: { objectKey: string; mediaType: string; title: string }): Promise<{ text: string; confidenceScore: number }>;
}

export class MockTranscriptionService implements TranscriptionService {
  async transcribe(input: { objectKey: string; mediaType: string; title: string }) {
    return {
      text: `Mock transcript for ${input.title}. Replace this service with a provider-backed transcription or document extraction pipeline.`,
      confidenceScore: 0.62
    };
  }
}

export const transcriptionService = new MockTranscriptionService();
