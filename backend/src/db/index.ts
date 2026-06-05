import { env } from "../config/env.js";
import type { GraphRepository } from "./graphRepository.js";
import { InMemoryGraphRepository } from "./inMemoryGraphRepository.js";
import { Neo4jGraphRepository } from "./neo4jGraphRepository.js";

export const graphRepository: GraphRepository =
  env.GRAPH_MODE === "neo4j" ? new Neo4jGraphRepository() : new InMemoryGraphRepository();
