import { env } from "../config/env.js";
import { graphRepository } from "../db/index.js";
import { seedDemoUsers } from "./demoUsers.js";

const run = async () => {
  const results = await seedDemoUsers(graphRepository);
  console.table(results);

  if (env.GRAPH_MODE === "memory") {
    console.warn("GRAPH_MODE=memory seeds only this short-lived script process. Use SEED_DEMO_USERS=true when starting the backend, or use GRAPH_MODE=neo4j for persistent seeded users.");
  }

  await graphRepository.close();
};

run().catch(async (error) => {
  console.error(error);
  await graphRepository.close();
  process.exit(1);
});
