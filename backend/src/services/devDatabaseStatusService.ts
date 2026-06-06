import neo4j from "neo4j-driver";
import { env } from "../config/env.js";

export type DevDatabaseStatus =
  | {
      ok: true;
      database: "neo4j";
      uri: string;
      responseMs: number;
      checkedAt: string;
    }
  | {
      ok: false;
      database: "neo4j";
      uri: string;
      responseMs: number;
      checkedAt: string;
      error: string;
    };

export const getDevDatabaseStatus = async (): Promise<DevDatabaseStatus> => {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD), {
    connectionAcquisitionTimeout: 3000,
    connectionTimeout: 3000,
    maxTransactionRetryTime: 1000,
    maxConnectionPoolSize: 1
  });
  const session = driver.session();

  try {
    await session.run("RETURN 1 AS ok");

    return {
      ok: true,
      database: "neo4j",
      uri: env.NEO4J_URI,
      responseMs: Date.now() - startedAt,
      checkedAt
    };
  } catch (error) {
    return {
      ok: false,
      database: "neo4j",
      uri: env.NEO4J_URI,
      responseMs: Date.now() - startedAt,
      checkedAt,
      error: error instanceof Error ? error.message : "Unable to connect to Neo4j."
    };
  } finally {
    await session.close();
    await driver.close();
  }
};
