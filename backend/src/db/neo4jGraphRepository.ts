import type { AdminSnippet, Material, Snippet, UserPublic } from "@shortlearn/shared";
import neo4j from "neo4j-driver";
import type {
  CreateMaterialInput,
  CreateSnippetInput,
  CreateUserInput,
  FeedOptions,
  SnippetAdminRecord,
  StoredUser,
  VectorSearchOptions
} from "../types/internal.js";
import type { GraphRepository } from "./graphRepository.js";
import { closeNeo4jDriver, getNeo4jDriver } from "./neo4j.js";

export class Neo4jGraphRepository implements GraphRepository {
  private driver = getNeo4jDriver();

  async close() {
    await closeNeo4jDriver();
  }

  async createUser(input: CreateUserInput) {
    const result = await this.driver.executeQuery(
      `CREATE (u:User {
        id: randomUUID(), email: toLower($email), displayName: $displayName, passwordHash: $passwordHash,
        roles: $roles, subjects: $subjects, createdAt: datetime()
      }) RETURN u`,
      { email: input.email, displayName: input.displayName, passwordHash: input.passwordHash, roles: input.roles ?? ["user"], subjects: input.subjects ?? [] }
    );
    return this.node<StoredUser>(result.records[0].get("u"));
  }

  async findUserByEmail(email: string) {
    const result = await this.driver.executeQuery("MATCH (u:User {email: toLower($email)}) RETURN u LIMIT 1", { email });
    return result.records[0] ? this.node<StoredUser>(result.records[0].get("u")) : null;
  }

  async findUserById(id: string) {
    const result = await this.driver.executeQuery("MATCH (u:User {id: $id}) RETURN u LIMIT 1", { id });
    return result.records[0] ? this.node<StoredUser>(result.records[0].get("u")) : null;
  }

  async listUsers() {
    const result = await this.driver.executeQuery("MATCH (u:User) RETURN u ORDER BY u.createdAt DESC");
    return result.records.map((record) => this.toPublicUser(this.node<StoredUser>(record.get("u"))));
  }

  async createMaterial(input: CreateMaterialInput) {
    const result = await this.driver.executeQuery(
      `MATCH (u:User {id: $ownerId})
       CREATE (m:Material {
        id: randomUUID(), ownerId: $ownerId, title: $title, description: $description, mediaType: $mediaType, subject: $subject,
        tags: $tags, objectKey: $objectKey, sourceUrl: $sourceUrl, originalName: $originalName,
        fileHash: $fileHash, fileSize: $fileSize, contentType: $contentType, isPublic: coalesce($isPublic, false),
        processingStatus: 'queued',
        moderationStatus: CASE WHEN coalesce($isPublic, false) THEN 'pending' ELSE 'private' END,
        uploadDate: datetime(), reliabilityScore: 50
       })
       CREATE (u)-[:USER_UPLOADED_MATERIAL]->(m)
       RETURN m`,
      input
    );
    return this.stripReliability(this.node<Material & { reliabilityScore: number }>(result.records[0].get("m")));
  }

  async findMaterialByOwnerAndFileHash(ownerId: string, fileHash: string) {
    const result = await this.driver.executeQuery(
      `MATCH (:User {id: $ownerId})-[:USER_UPLOADED_MATERIAL]->(m:Material {fileHash: $fileHash})
       RETURN m
       ORDER BY m.uploadDate ASC
       LIMIT 1`,
      { ownerId, fileHash }
    );
    return result.records[0] ? this.stripReliability(this.node<Material & { reliabilityScore: number }>(result.records[0].get("m"))) : null;
  }

  async listMaterialsForUser(userId: string) {
    const result = await this.driver.executeQuery(
      `MATCH (:User {id: $userId})-[r:USER_UPLOADED_MATERIAL|USER_SAVED_MATERIAL]->(m:Material)
       WHERE type(r) = 'USER_UPLOADED_MATERIAL' OR (m.isPublic = true AND m.moderationStatus = 'approved')
       RETURN DISTINCT m
       ORDER BY m.uploadDate DESC`,
      { userId }
    );
    return result.records.map((record) => this.stripReliability(this.node<Material & { reliabilityScore: number }>(record.get("m"))));
  }

  async listAllMaterials() {
    const result = await this.driver.executeQuery("MATCH (m:Material) RETURN m ORDER BY m.uploadDate DESC");
    return result.records.map((record) => this.stripReliability(this.node<Material & { reliabilityScore: number }>(record.get("m"))));
  }

  async getMaterialForUser(materialId: string, userId: string, isAdmin: boolean) {
    const result = await this.driver.executeQuery(
      `MATCH (m:Material {id: $materialId})
       OPTIONAL MATCH (:User {id: $userId})-[:USER_UPLOADED_MATERIAL]->(m)
       WITH m, count(*) > 0 AS owns
       OPTIONAL MATCH (:User {id: $userId})-[:USER_SAVED_MATERIAL]->(m)
       WITH m, owns, count(*) > 0 AS saved
       WHERE $isAdmin OR owns OR (saved AND m.isPublic = true AND m.moderationStatus = 'approved')
       RETURN m LIMIT 1`,
      { materialId, userId, isAdmin }
    );
    return result.records[0] ? this.stripReliability(this.node<Material & { reliabilityScore: number }>(result.records[0].get("m"))) : null;
  }

  async patchMaterial(materialId: string, userId: string, patch: Partial<Material>) {
    const result = await this.driver.executeQuery(
      `MATCH (:User {id: $userId})-[:USER_UPLOADED_MATERIAL]->(m:Material {id: $materialId})
       SET m += $patch
       WITH m
       OPTIONAL MATCH (m)-[:MATERIAL_GENERATED_SNIPPET]->(s:Snippet)
       FOREACH (_ IN CASE WHEN $isPublic = false AND s IS NOT NULL THEN [1] ELSE [] END |
         SET s.moderationStatus = 'private', s.isPublic = false
       )
       FOREACH (_ IN CASE WHEN $isPublic = true AND s.moderationStatus = 'private' THEN [1] ELSE [] END |
         SET s.moderationStatus = 'pending', s.isPublic = true
       )
       FOREACH (_ IN CASE WHEN $isPublic = false THEN [1] ELSE [] END |
         SET m.moderationStatus = 'private'
       )
       FOREACH (_ IN CASE WHEN $isPublic = true THEN [1] ELSE [] END |
         SET m.moderationStatus = 'pending'
       )
       RETURN m`,
      { materialId, userId, patch, isPublic: patch.isPublic ?? null }
    );
    return result.records[0] ? this.stripReliability(this.node<Material & { reliabilityScore: number }>(result.records[0].get("m"))) : null;
  }

  async deleteMaterial(materialId: string, userId: string, isAdmin: boolean) {
    const access = await this.driver.executeQuery(
      `MATCH (m:Material {id: $materialId})
       WITH m, m.ownerId = $userId AS owns
       OPTIONAL MATCH (:User {id: $userId})-[saved:USER_SAVED_MATERIAL]->(m)
       RETURN m.id AS id, owns, saved IS NOT NULL AS saved
       LIMIT 1`,
      { materialId, userId }
    );
    if (!access.records[0]) return false;

    const owns = access.records[0].get("owns") as boolean;
    const saved = access.records[0].get("saved") as boolean;
    if (!isAdmin && !owns && saved) {
      const result = await this.driver.executeQuery(
        `MATCH (:User {id: $userId})-[saved:USER_SAVED_MATERIAL]->(:Material {id: $materialId})
         DELETE saved
         RETURN count(*) AS deleted`,
        { materialId, userId }
      );
      return result.records[0].get("deleted").toNumber() > 0;
    }
    if (!isAdmin && !owns) return false;

    await this.driver.executeQuery(
      `MATCH (:Material {id: $materialId})-[:MATERIAL_GENERATED_SNIPPET]->(s:Snippet)
       DETACH DELETE s`,
      { materialId }
    );
    const result = await this.driver.executeQuery(
      `MATCH (m:Material {id: $materialId})
       DETACH DELETE m
       RETURN count(*) AS deleted`,
      { materialId }
    );
    return result.records[0].get("deleted").toNumber() > 0;
  }

  async removeSavedMaterialForUser(materialId: string, userId: string) {
    const result = await this.driver.executeQuery(
      `MATCH (:User {id: $userId})-[saved:USER_SAVED_MATERIAL]->(:Material {id: $materialId})
       DELETE saved
       RETURN count(*) AS deleted`,
      { materialId, userId }
    );
    return result.records[0].get("deleted").toNumber() > 0;
  }

  async createSnippet(input: CreateSnippetInput) {
    const result = await this.driver.executeQuery(
      `MATCH (u:User {id: $uploaderId})
       OPTIONAL MATCH (m:Material {id: $sourceMaterialId})
       CREATE (s:Snippet {
        id: randomUUID(), sourceMaterialId: $sourceMaterialId, uploaderId: $uploaderId,
        title: $title, subject: $subject, tags: $tags, summary: $summary, transcript: $transcript,
        contentType: $contentType, objectKey: $objectKey, citation: $citation, confidenceScore: $confidenceScore,
        reliabilityScore: $reliabilityScore, moderationStatus: CASE WHEN $isPublic THEN 'pending' ELSE 'private' END,
        verificationStatus: 'unverified', isPublic: $isPublic, createdAt: datetime()
       })
       CREATE (u)-[:USER_UPLOADED_SNIPPET]->(s)
       FOREACH (_ IN CASE WHEN m IS NULL THEN [] ELSE [1] END | CREATE (m)-[:MATERIAL_GENERATED_SNIPPET]->(s))
       RETURN s`,
      input
    );
    return this.toAdminSnippet(this.node<SnippetAdminRecord>(result.records[0].get("s")));
  }

  async listFeed(options: FeedOptions) {
    const result = await this.driver.executeQuery(
      `MATCH (s:Snippet)
       WHERE s.isPublic = true AND s.moderationStatus = 'approved'
       OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
       OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
       WITH s, coalesce(relMaterial, idMaterial) AS m
       WHERE m IS NOT NULL
       RETURN s, m
       ORDER BY s.createdAt DESC
       LIMIT $limit`,
      { limit: this.limit(options.limit) }
    );
    return result.records.map((record) => {
      const snippet = this.toPublicSnippet(this.toAdminSnippet(this.node<SnippetAdminRecord>(record.get("s"))));
      const material = this.stripReliability(this.node<Material & { reliabilityScore: number }>(record.get("m")));
      return {
        ...snippet,
        sourceMaterial: {
          id: material.id,
          title: material.title,
          mediaType: material.mediaType
        }
      };
    });
  }

  async getPublicSnippet(snippetId: string) {
    const result = await this.driver.executeQuery(
      `MATCH (s:Snippet {id: $snippetId})
       WHERE s.isPublic = true AND s.moderationStatus = 'approved'
       OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
       OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
       WITH s, coalesce(relMaterial, idMaterial) AS m
       WHERE m IS NOT NULL
       RETURN s, m LIMIT 1`,
      { snippetId }
    );
    if (!result.records[0]) return null;
    const snippet = this.toPublicSnippet(this.toAdminSnippet(this.node<SnippetAdminRecord>(result.records[0].get("s"))));
    const material = this.stripReliability(this.node<Material & { reliabilityScore: number }>(result.records[0].get("m")));
    return {
      ...snippet,
      sourceMaterial: {
        id: material.id,
        title: material.title,
        mediaType: material.mediaType
      }
    };
  }

  async getApprovedSnippetSourceMaterial(snippetId: string) {
    const result = await this.driver.executeQuery(
      `MATCH (s:Snippet {id: $snippetId})
       WHERE s.isPublic = true AND s.moderationStatus = 'approved'
       OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
       OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
       WITH coalesce(relMaterial, idMaterial) AS m
       WHERE m IS NOT NULL
       RETURN m LIMIT 1`,
      { snippetId }
    );
    return result.records[0] ? this.stripReliability(this.node<Material & { reliabilityScore: number }>(result.records[0].get("m"))) : null;
  }

  async getReviewSnippetSourceMaterial(snippetId: string) {
    const result = await this.driver.executeQuery(
      `MATCH (s:Snippet {id: $snippetId})
       WHERE s.moderationStatus IN ['pending', 'approved']
       OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
       OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
       WITH coalesce(relMaterial, idMaterial) AS m
       WHERE m IS NOT NULL
       RETURN m LIMIT 1`,
      { snippetId }
    );
    return result.records[0] ? this.stripReliability(this.node<Material & { reliabilityScore: number }>(result.records[0].get("m"))) : null;
  }

  async listPendingSnippets() {
    const result = await this.driver.executeQuery(
      `MATCH (s:Snippet {moderationStatus: 'pending'})
       OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
       OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
       WITH s, coalesce(relMaterial, idMaterial) AS m
       WHERE m IS NOT NULL
       RETURN s, m ORDER BY s.createdAt ASC`
    );
    return result.records.map((record) => this.toAdminSnippetWithMaterial(record.get("s"), record.get("m")));
  }

  async listApprovedSnippets() {
    const result = await this.driver.executeQuery(
      `MATCH (s:Snippet {moderationStatus: 'approved'})
       WHERE s.isPublic = true
       OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
       OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
       WITH s, coalesce(relMaterial, idMaterial) AS m
       WHERE m IS NOT NULL
       RETURN s, m ORDER BY s.createdAt DESC`
    );
    return result.records.map((record) => this.toAdminSnippetWithMaterial(record.get("s"), record.get("m")));
  }

  async moderateSnippet(snippetId: string, status: "approved" | "rejected", reviewerId: string) {
    const result = await this.driver.executeQuery(
      `MATCH (admin:User {id: $reviewerId}), (s:Snippet {id: $snippetId})
       SET s.moderationStatus = $status
       SET s.isPublic = CASE WHEN $status = 'approved' THEN true ELSE false END
       CREATE (admin)-[:ADMIN_REVIEWED_SNIPPET {status: $status, reviewedAt: datetime()}]->(s)
       WITH s
       OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
       OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
       WITH s, coalesce(relMaterial, idMaterial) AS m
       FOREACH (_ IN CASE WHEN m IS NULL THEN [] ELSE [1] END |
         SET m.moderationStatus = $status, m.isPublic = CASE WHEN $status = 'approved' THEN true ELSE false END
       )
       RETURN s, m`,
      { snippetId, status, reviewerId }
    );
    if (!result.records[0]) return null;
    const material = result.records[0].get("m");
    return material ? this.toAdminSnippetWithMaterial(result.records[0].get("s"), material) : this.toAdminSnippet(this.node<SnippetAdminRecord>(result.records[0].get("s")));
  }

  private limit(value: number) {
    return neo4j.int(Math.max(1, Math.min(Math.trunc(value), 100)));
  }

  async setSourceReliability(sourceId: string, score: number) {
    await this.driver.executeQuery(
      "MATCH (n) WHERE n.id = $sourceId AND (n:Source OR n:Snippet OR n:Material) SET n.reliabilityScore = $score",
      { sourceId, score }
    );
  }

  async search(options: VectorSearchOptions) {
    const result = await this.driver.executeQuery(
      `CALL {
        MATCH (m:Material)
        WHERE ($userId IS NULL OR m.isPublic = true OR EXISTS { MATCH (:User {id: $userId})-[:USER_UPLOADED_MATERIAL]->(m) })
        AND toLower(m.title + ' ' + coalesce(m.description, '') + ' ' + m.subject) CONTAINS toLower($query)
        RETURN m AS item, m.uploadDate AS sortDate
        UNION
        MATCH (s:Snippet)
        WHERE s.isPublic = true AND s.moderationStatus = 'approved'
        AND toLower(s.title + ' ' + s.summary + ' ' + coalesce(s.transcript, '') + ' ' + s.subject) CONTAINS toLower($query)
        RETURN s AS item, s.createdAt AS sortDate
       }
       RETURN item
       ORDER BY sortDate DESC
       LIMIT $limit`,
      { query: options.query, userId: options.userId ?? null, limit: this.limit(options.limit) }
    );
    return result.records.map((record) => {
      const node = record.get("item");
      const labels: string[] = node.labels ?? [];
      return labels.includes("Snippet")
        ? this.toPublicSnippet(this.toAdminSnippet(this.node<SnippetAdminRecord>(node)))
        : this.stripReliability(this.node<Material & { reliabilityScore: number }>(node));
    });
  }

  async recordSnippetEvent(userId: string, snippetId: string, event: "viewed" | "liked" | "saved" | "reported") {
    const relationship = {
      viewed: "USER_VIEWED_SNIPPET",
      liked: "USER_LIKED_SNIPPET",
      saved: "USER_SAVED_SNIPPET",
      reported: "USER_REPORTED_SNIPPET"
    }[event];
    await this.driver.executeQuery(
      `MATCH (u:User {id: $userId}), (s:Snippet {id: $snippetId})
       MERGE (u)-[r:${relationship}]->(s)
       SET r.updatedAt = datetime()`,
      { userId, snippetId }
    );
    if (event === "saved") {
      await this.driver.executeQuery(
        `MATCH (u:User {id: $userId}), (s:Snippet {id: $snippetId})
         WHERE s.isPublic = true AND s.moderationStatus = 'approved'
         OPTIONAL MATCH (relMaterial:Material)-[:MATERIAL_GENERATED_SNIPPET]->(s)
         OPTIONAL MATCH (idMaterial:Material {id: s.sourceMaterialId})
         WITH u, coalesce(relMaterial, idMaterial) AS m
         WHERE m IS NOT NULL
         MERGE (u)-[r:USER_SAVED_MATERIAL]->(m)
         SET r.updatedAt = datetime()`,
        { userId, snippetId }
      );
    }
    if (event === "reported") {
      await this.driver.executeQuery(
        `MATCH (u:User {id: $userId}), (s:Snippet {id: $snippetId})
         CREATE (r:Report {id: randomUUID(), reason: 'User report', status: 'open', createdAt: datetime()})
         CREATE (u)-[:USER_CREATED_REPORT]->(r)-[:REPORT_TARGETS_SNIPPET]->(s)`,
        { userId, snippetId }
      );
    }
  }

  async listReports() {
    const result = await this.driver.executeQuery(
      `MATCH (u:User)-[:USER_CREATED_REPORT]->(r:Report)-[:REPORT_TARGETS_SNIPPET]->(s:Snippet)
       RETURN r.id AS id, s.id AS snippetId, u.id AS reporterId, r.reason AS reason, r.status AS status, toString(r.createdAt) AS createdAt
       ORDER BY r.createdAt DESC`
    );
    return result.records.map((record) => ({
      id: record.get("id"),
      snippetId: record.get("snippetId"),
      reporterId: record.get("reporterId"),
      reason: record.get("reason"),
      status: record.get("status"),
      createdAt: record.get("createdAt")
    }));
  }

  async updateReport(reportId: string, status: string) {
    await this.driver.executeQuery("MATCH (r:Report {id: $reportId}) SET r.status = $status", { reportId, status });
  }

  private node<T>(node: { properties: T }) {
    return node.properties;
  }

  private toPublicUser(user: StoredUser): UserPublic {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  private stripReliability(material: Material & { reliabilityScore?: number }): Material {
    const { reliabilityScore: _reliabilityScore, ...safeMaterial } = material;
    return safeMaterial;
  }

  private toAdminSnippet(snippet: SnippetAdminRecord): AdminSnippet {
    return { ...snippet, supportingSources: snippet.supportingSources ?? [], conflictingSources: snippet.conflictingSources ?? [] };
  }

  private toAdminSnippetWithMaterial(snippetNode: { properties: SnippetAdminRecord }, materialNode: { properties: Material & { reliabilityScore?: number } }): AdminSnippet {
    const snippet = this.toAdminSnippet(this.node<SnippetAdminRecord>(snippetNode));
    const material = this.stripReliability(this.node<Material & { reliabilityScore?: number }>(materialNode));
    return {
      ...snippet,
      sourceMaterial: {
        id: material.id,
        title: material.title,
        mediaType: material.mediaType
      }
    };
  }

  private toPublicSnippet(snippet: SnippetAdminRecord): Snippet {
    const { reliabilityScore: _reliabilityScore, supportingSources: _supportingSources, conflictingSources: _conflictingSources, ...safeSnippet } = snippet;
    return safeSnippet;
  }
}
