import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { env } from "../config/env.js";
import { runLocalCommand } from "../utils/localProcess.js";
import { objectStorageService } from "./objectStorageService.js";

export interface TranscriptionService {
  transcribe(input: { objectKey: string; mediaType: string; title: string }): Promise<{ text: string; confidenceScore: number }>;
}

export class LocalWhisperTranscriptionService implements TranscriptionService {
  async transcribe(input: { objectKey: string; mediaType: string; title: string }) {
    if (!["audio", "video"].includes(input.mediaType)) {
      return {
        text: `Material "${input.title}" is not audio or video, so transcription was skipped.`,
        confidenceScore: 0.2
      };
    }

    if (!env.WHISPER_BINARY || !env.WHISPER_MODEL_PATH) {
      return {
        text: `Local transcription is not configured for "${input.title}". Set WHISPER_BINARY and WHISPER_MODEL_PATH to use whisper.cpp locally.`,
        confidenceScore: 0.2
      };
    }

    const sourcePath = this.resolvePath(input.objectKey);
    const workDir = await mkdtemp(path.join(tmpdir(), "shortlearn-transcribe-"));
    const wavPath = path.join(workDir, "audio.wav");

    try {
      await runLocalCommand(env.FFMPEG_BINARY, ["-y", "-i", sourcePath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wavPath], {
        timeoutMs: 300_000
      });

      const outputBase = path.join(workDir, "transcript");
      await runLocalCommand(env.WHISPER_BINARY, ["-m", env.WHISPER_MODEL_PATH, "-f", wavPath, "-otxt", "-of", outputBase], {
        timeoutMs: 900_000
      });

      const text = (await readFile(`${outputBase}.txt`, "utf8")).trim();
      return {
        text,
        confidenceScore: text.length > 80 ? 0.78 : 0.45
      };
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }

  private resolvePath(objectKey: string) {
    if (!objectStorageService.resolveObjectPath) {
      throw new Error("Local transcription requires object storage with filesystem path resolution.");
    }
    return objectStorageService.resolveObjectPath(objectKey);
  }
}

export class MockTranscriptionService implements TranscriptionService {
  async transcribe(input: { objectKey: string; mediaType: string; title: string }) {
    return {
      text: `Mock transcript for ${input.title}. Replace this service with a provider-backed transcription or document extraction pipeline.`,
      confidenceScore: 0.62
    };
  }
}

export const transcriptionService: TranscriptionService = new LocalWhisperTranscriptionService();
