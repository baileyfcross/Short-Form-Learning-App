import neo4j, { type Driver } from "neo4j-driver";
import { env } from "../config/env.js";

let driver: Driver | null = null;

export const getNeo4jDriver = () => {
  if (!driver) {
    driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD), {
      connectionAcquisitionTimeout: 3000,
      connectionTimeout: 3000,
      maxTransactionRetryTime: 1000
    });
  }
  return driver;
};

export const initializeNeo4jDatabase = async () => {
  const databaseDriver = getNeo4jDriver();
  const statements = [
    "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
    "CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE",
    "CREATE CONSTRAINT material_id IF NOT EXISTS FOR (m:Material) REQUIRE m.id IS UNIQUE",
    "CREATE INDEX material_owner_file_hash IF NOT EXISTS FOR (m:Material) ON (m.ownerId, m.fileHash)",
    "MATCH (u:User)-[:USER_UPLOADED_MATERIAL]->(m:Material) WHERE m.ownerId IS NULL SET m.ownerId = u.id",
    "MATCH (m:Material) WHERE m.moderationStatus IS NULL SET m.moderationStatus = CASE WHEN coalesce(m.isPublic, false) THEN 'pending' ELSE 'private' END",
    "MATCH (u:User)-[:USER_UPLOADED_SNIPPET]->(s:Snippet) WHERE s.uploaderId IS NULL SET s.uploaderId = u.id",
    "MATCH (m:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s:Snippet) WHERE s.sourceMaterialId IS NULL SET s.sourceMaterialId = m.id",
    "MATCH (m:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s:Snippet {moderationStatus: 'approved'}) WHERE coalesce(m.isPublic, false) SET m.moderationStatus = 'approved'",
    "MATCH (m:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s:Snippet {moderationStatus: 'rejected'}) WHERE coalesce(m.isPublic, false) AND m.moderationStatus <> 'approved' SET m.moderationStatus = 'rejected'",
    "MATCH (s:Snippet) WHERE s.sourceMaterialId IS NOT NULL MATCH (m:Material {id: s.sourceMaterialId}) MERGE (m)-[:MATERIAL_GENERATED_SNIPPET]->(s)"
  ];

  await databaseDriver.verifyConnectivity();

  for (const statement of statements) {
    await databaseDriver.executeQuery(statement);
  }
};

export const closeNeo4jDriver = async () => {
  await driver?.close();
  driver = null;
};
