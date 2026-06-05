import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { graphRepository } from "./db/index.js";
import { seedDemoUsers } from "./seed/demoUsers.js";

let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

const start = async () => {
  if (env.SEED_DEMO_USERS || env.DEV_LOGIN_ENABLED) {
    const results = await seedDemoUsers(graphRepository);
    console.table(results);
  }

  const app = createApp();
  server = app.listen(env.PORT, () => {
    console.log(`ShortLearn API listening on http://localhost:${env.PORT}`);
  });
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
