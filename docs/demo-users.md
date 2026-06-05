# Demo Users

These accounts are for local development only. Do not use these credentials in production.

| Role | Email | Password |
|---|---|---|
| Learner | `learner@example.com` | `ChangeMe12345` |
| Moderator | `moderator@example.com` | `ChangeMe12345` |
| Admin | `admin@example.com` | `ChangeMe12345` |

## In-Memory Mode

The default `GRAPH_MODE=memory` database disappears whenever the backend process stops. To seed demo users each time the backend starts, set:

```bash
SEED_DEMO_USERS=true
DEMO_USER_PASSWORD=ChangeMe12345
```

Then run:

```bash
npm run dev:local-auth
```

This starts the backend with `DEV_LOGIN_ENABLED=true` and the frontend with `VITE_DEV_LOGIN_ENABLED=true`. The frontend stores your selected demo user email in `localStorage`, so it survives frontend rebuilds until you log out or clear browser storage.

## Neo4j Mode

For persistent demo users, configure Neo4j in `.env`:

```bash
GRAPH_MODE=neo4j
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

Then run:

```bash
npm run seed
```

The seed script is idempotent by email. Existing demo users are left in place.

## Production Builds

Use this command when building for production:

```bash
npm run build:production
```

That script explicitly sets:

```bash
NODE_ENV=production
DEV_LOGIN_ENABLED=false
SEED_DEMO_USERS=false
VITE_DEV_LOGIN_ENABLED=false
```

The backend also refuses to start if `DEV_LOGIN_ENABLED=true` while `NODE_ENV=production`.
