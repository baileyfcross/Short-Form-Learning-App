# Local Processing Pipeline

The backend now runs uploads through local processing services before creating snippet candidates.

## Included Node Libraries

- PDF text extraction: `pdf-parse`
- DOCX parsing: `mammoth`
- Plain text and basic HTML extraction: built-in Node file reads plus simple HTML stripping
- Embeddings: deterministic local hashing embeddings with configurable dimensions
- Fact extraction: local Ollama JSON extraction when configured, with a rules-based fallback

## Optional Local Binaries

Install these on your machine when you want richer local processing:

- `tesseract`: OCR for image uploads.
- `ffmpeg`: converts audio/video into 16 kHz mono WAV for transcription.
- `whisper.cpp`: local audio/video transcription.
- `ollama`: local LLM fact extraction.

## Environment Variables

```bash
EMBEDDING_DIMENSIONS=384
FFMPEG_BINARY=ffmpeg
WHISPER_BINARY=C:\path\to\whisper-cli.exe
WHISPER_MODEL_PATH=C:\path\to\ggml-base.en.bin
TESSERACT_BINARY=tesseract
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

Leave `WHISPER_BINARY`, `WHISPER_MODEL_PATH`, or `OLLAMA_MODEL` empty to use graceful fallbacks. Audio/video uploads will still create a pending snippet, but the transcript will say local transcription is not configured.

## How Upload Processing Works

1. Store the uploaded file in local object storage.
2. Resolve the object key to a local path.
3. Parse documents with `pdf-parse`, `mammoth`, text reads, or Tesseract OCR.
4. Transcribe audio/video with `ffmpeg` plus `whisper.cpp` when configured.
5. Split extracted text/transcripts into chunks.
6. Generate local embeddings for chunks.
7. Extract fact candidates with Ollama or rules.
8. Create a private or pending public snippet candidate for moderation.

## Notes

The local hash embedder is useful for deterministic development, tests, and small demos. For stronger semantic search, replace `LocalHashEmbeddingService` with `transformers.js`, Ollama embeddings, Python `sentence-transformers`, or a hosted embedding API.
