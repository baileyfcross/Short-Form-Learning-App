import neo4j, { type Driver } from "neo4j-driver";
import { env } from "../config/env.js";

let driver: Driver | null = null;

export const getNeo4jDriver = () => {
  if (!driver) {
    driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD));
  }
  return driver;
};

export const closeNeo4jDriver = async () => {
  await driver?.close();
  driver = null;
};
