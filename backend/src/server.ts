import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { graphRepository } from "./db/index.js";

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`ShortLearn API listening on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await graphRepository.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
