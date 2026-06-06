import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { graphRepository } from "./db/index.js";
import { initializeNeo4jDatabase } from "./db/neo4j.js";
import { seedDemoUsers } from "./seed/demoUsers.js";

let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

const start = async () => {
  const app = createApp();
  server = app.listen(env.PORT, () => {
    console.log(`ShortLearn API listening on http://localhost:${env.PORT}`);

    if (env.NODE_ENV === "development") {
      void printDevDatabaseStatus();
    }

    void runStartupDatabaseTasks();
  });
};

const runStartupDatabaseTasks = async () => {
  try {
    if (env.GRAPH_MODE === "neo4j") {
      await initializeNeo4jDatabase();
    }

    if (env.SEED_DEMO_USERS || env.DEV_LOGIN_ENABLED) {
      const results = await seedDemoUsers(graphRepository);
      console.table(results);
    }
  } catch (error) {
    if (env.NODE_ENV !== "development") {
      console.error(error);
      await graphRepository.close();
      process.exit(1);
    }

    console.warn("Development database initialization skipped.");
    console.warn(error instanceof Error ? error.message : error);
    console.warn("Start Neo4j with `npm run db:up`, then restart the backend when you want persistent database-backed dev data.");
  }
};

const printDevDatabaseStatus = async () => {
  const url = `http://localhost:${env.PORT}/api/dev/database/status`;

  try {
    const response = await fetch(url);
    const body = await response.json();
    console.log("Development database status:");
    console.log(JSON.stringify(body, null, 2));
  } catch (error) {
    console.warn(`Unable to call development database status endpoint at ${url}.`);
    console.warn(error instanceof Error ? error.message : error);
  }
};

const shutdown = async () => {
  server.close(async () => {
    await graphRepository.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error(error);
  await graphRepository.close();
  process.exit(1);
});
