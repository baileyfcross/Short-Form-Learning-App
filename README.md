# ShortLearn MVP

Secure, production-minded MVP scaffold for a short-form learning app with a React web frontend, Express backend, Neo4j graph/vector architecture, and object-storage based uploads.

## What Is Included

- React web app with login/signup, feed, library, upload, search, and admin moderation screens.
- Express API with modular routes, controllers, services, validation, auth, role checks, rate limits, secure headers, and centralized error handling.
- Graph repository abstraction with `GRAPH_MODE=memory` for local demos and `GRAPH_MODE=neo4j` for Neo4j.
- Object storage, embedding, transcription, parsing, extraction, and fact verification service interfaces.
- Local processing pipelines for PDF/DOCX/text/image extraction, optional Whisper transcription, local embeddings, and fact extraction.
- Neo4j node/relationship schema notes, constraints, and vector index examples.
- Admin-only reliability handling; normal user responses do not expose reliability scores.

## Setup

```bash
npm install
cp .env.example .env
npm run dev:backend
npm run dev:frontend
```

The backend defaults to `GRAPH_MODE=memory`, so it can run without Neo4j for first local testing. Set `GRAPH_MODE=neo4j` and configure `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` to use a real database.

For a production-build preview of the web app:

```bash
npm run build
npm run preview:frontend
```

## API

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Library:

- `GET /api/library`
- `POST /api/library/upload`
- `GET /api/library/:id`
- `DELETE /api/library/:id`
- `PATCH /api/library/:id`

Feed:

- `GET /api/feed`
- `GET /api/feed/:snippetId`
- `POST /api/feed/:snippetId/like`
- `POST /api/feed/:snippetId/save`
- `POST /api/feed/:snippetId/report`

Search:

- `GET /api/search`
- `POST /api/search/vector`

Admin:

- `GET /api/admin/materials`
- `GET /api/admin/snippets/pending`
- `PATCH /api/admin/snippets/:id/approve`
- `PATCH /api/admin/snippets/:id/reject`
- `PATCH /api/admin/sources/:id/reliability`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id`

## Notes

- Uploaded files are stored by object key; Neo4j stores metadata and relationships only.
- Public feed content only comes from approved snippets.
- The current processing pipeline generates a pending snippet from uploaded public material using local parsers and graceful fallbacks.
- See [local processing](docs/local-processing.md), [Neo4j schema](docs/neo4j-schema.md), [security notes](docs/security-notes.md), and [production TODO](docs/production-todo.md).
