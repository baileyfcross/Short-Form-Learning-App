# Production TODO

- Replace mock embedding, transcription, and verification services with provider-backed implementations.
- Persist transcript chunks, embeddings, facts, and source relationships in the processing worker.
- Move media processing to a queue such as BullMQ, Temporal, Cloud Tasks, or a managed worker platform.
- Use S3-compatible object storage with private buckets and signed URLs.
- Add image/video/audio duration, codec, and file signature validation.
- Add Neo4j migrations instead of manually applying Cypher.
- Add automated tests for auth, authorization, upload validation, moderation, and reliability-field redaction.
- Add mobile app package using Expo and reuse the backend API/client contracts.
- Add moderation review history and user report workflows to the admin dashboard.
- Add source management screens for trusted source lists.
- Add observability: traces, metrics, request IDs, structured logs, and alerting.
- Add content policy checks for copyright, safety, and low-quality generated snippets.
