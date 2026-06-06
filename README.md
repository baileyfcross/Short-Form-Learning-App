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
npm run dev
```

The backend defaults to `GRAPH_MODE=memory`, so it can run without Neo4j for first local testing. Set `GRAPH_MODE=neo4j` and configure `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` to use a real database.

To run Neo4j locally in Docker:

```bash
npm run db:up
```

Then set these values in `.env`:

```bash
GRAPH_MODE=neo4j
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

Neo4j Browser will be available at `http://localhost:7474`. To stop the database while keeping its volume, run `npm run db:stop`. To stop and remove the container while keeping the database volume, run `npm run db:down`. To remove the database volume and start clean, run `docker compose down -v`.

In development, the backend exposes `GET /api/dev/database/status` to check the Docker-backed Neo4j connection. When the backend starts, it calls that endpoint once and prints the JSON status in the terminal. If Neo4j is not running, startup continues and the database initialization step is skipped with a warning.

`npm run dev` starts both the backend and frontend together with local demo auth enabled. It does not start or replace the Docker database. Start the Neo4j container yourself with `npm run db:up` when you want it running, then keep using the same container across backend restarts.

The backend runs with `GRAPH_MODE=neo4j` during normal dev, so users, uploaded material metadata, moderation decisions, and public feed snippets persist in the database you started. Uploaded file bytes stay in `backend/storage` under the original owner's user id, and repeated uploads of the same file by the same owner reuse the existing material record instead of creating another stored copy.

Use `npm run dev:memory` if you want the old reset-on-start local demo mode. You can still run either side alone with `npm run dev:backend` or `npm run dev:frontend`.

Normal `npm run dev` keeps the local backend file storage folder. To clear it manually:

```bash
npm run storage:clear
```

To preview the folder that would be cleared:

```bash
npm run storage:clear:dry-run
```

To stop local app servers on ports `4000`, `4173`, and `5173`:

```bash
npm run stop
```

To inspect what would be stopped first:

```bash
npm run stop:dry-run
```

Local demo login credentials are documented in [demo users](docs/demo-users.md). `npm run dev` enables persistent local demo login through dev-only middleware. Use `npm run dev:no-local-auth` if you want to run local development without that helper, or `npm run seed` for a persistent Neo4j database.

For production builds, use:

```bash
npm run build:production
```

That script disables demo users and dev login controls.

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
- Upload owners can view and download their own full materials immediately from their personal library.
- Admins and moderators can view uploaded files from the review dashboard.
- Public feed content only comes from approved snippets generated from user library uploads.
- Feed users can view the approved snippet and its source document after approval.
- Approved feed items are visible to every role. User role, subject preference, viewed history, and internal reliability score do not hide approved feed items.
- Deleting an uploaded material also removes generated snippets for that material from the public feed and deletes the locally stored file.
- Moderation is only required before other users can see public snippets or facts; it does not block the uploader's private access.
- The current processing pipeline generates a pending snippet from uploaded public material using local parsers and graceful fallbacks.
- Selecting a file on the upload screen inspects local metadata and pre-fills title, description, subject, and tags while keeping every field editable.
- See [local processing](docs/local-processing.md), [Neo4j schema](docs/neo4j-schema.md), [security notes](docs/security-notes.md), and [production TODO](docs/production-todo.md).
