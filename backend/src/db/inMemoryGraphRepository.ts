import { randomUUID } from "node:crypto";
import type { AdminSnippet, Material, Snippet, UserPublic } from "@shortlearn/shared";
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

export class InMemoryGraphRepository implements GraphRepository {
  private users = new Map<string, StoredUser>();
  private materials = new Map<string, Material & { reliabilityScore: number }>();
  private snippets = new Map<string, SnippetAdminRecord>();
  private viewed = new Map<string, Set<string>>();
  private reports = new Map<string, { id: string; snippetId: string; reporterId: string; reason: string; status: string; createdAt: string }>();

  async close() {}

  async createUser(input: CreateUserInput) {
    const existing = await this.findUserByEmail(input.email);
    if (existing) {
      throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
    }

    const user: StoredUser = {
      id: randomUUID(),
      email: input.email.toLowerCase(),
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      roles: input.roles ?? ["user"],
      subjects: input.subjects ?? [],
      createdAt: new Date().toISOString()
    };
    this.users.set(user.id, user);
    return user;
  }

  async findUserByEmail(email: string) {
    const normalized = email.toLowerCase();
    return [...this.users.values()].find((user) => user.email === normalized) ?? null;
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async listUsers() {
    return [...this.users.values()].map(this.toPublicUser);
  }

  async createMaterial(input: CreateMaterialInput) {
    const material: Material & { reliabilityScore: number } = {
      id: randomUUID(),
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      mediaType: input.mediaType,
      subject: input.subject,
      tags: input.tags,
      objectKey: input.objectKey,
      sourceUrl: input.sourceUrl,
      isPublic: input.isPublic ?? false,
      processingStatus: "queued",
      uploadDate: new Date().toISOString(),
      reliabilityScore: 50
    };
    this.materials.set(material.id, material);
    return this.stripReliability(material);
  }

  async listMaterialsForUser(userId: string) {
    return [...this.materials.values()].filter((material) => material.ownerId === userId).map(this.stripReliability);
  }

  async listAllMaterials() {
    return [...this.materials.values()].map(this.stripReliability);
  }

  async getMaterialForUser(materialId: string, userId: string, isAdmin: boolean) {
    const material = this.materials.get(materialId);
    if (!material || (!isAdmin && material.ownerId !== userId && !material.isPublic)) return null;
    return this.stripReliability(material);
  }

  async patchMaterial(materialId: string, userId: string, patch: Partial<Material>) {
    const material = this.materials.get(materialId);
    if (!material || material.ownerId !== userId) return null;
    const allowedPatch = {
      title: patch.title,
      description: patch.description,
      subject: patch.subject,
      tags: patch.tags,
      isPublic: patch.isPublic
    };
    const updated = { ...material, ...Object.fromEntries(Object.entries(allowedPatch).filter(([, value]) => value !== undefined)) };
    this.materials.set(materialId, updated);
    return this.stripReliability(updated);
  }

  async deleteMaterial(materialId: string, userId: string, isAdmin: boolean) {
    const material = this.materials.get(materialId);
    if (!material || (!isAdmin && material.ownerId !== userId)) return false;
    return this.materials.delete(materialId);
  }

  async createSnippet(input: CreateSnippetInput) {
    const snippet: SnippetAdminRecord = {
      id: randomUUID(),
      sourceMaterialId: input.sourceMaterialId,
      uploaderId: input.uploaderId,
      title: input.title,
      subject: input.subject,
      tags: input.tags,
      summary: input.summary,
      transcript: input.transcript,
      contentType: input.contentType,
      objectKey: input.objectKey,
      citation: input.citation,
      confidenceScore: input.confidenceScore,
      reliabilityScore: input.reliabilityScore,
      moderationStatus: input.isPublic ? "pending" : "private",
      verificationStatus: "unverified",
      isPublic: input.isPublic,
      createdAt: new Date().toISOString(),
      supportingSources: [],
      conflictingSources: []
    };
    this.snippets.set(snippet.id, snippet);
    return snippet;
  }

  async listFeed(options: FeedOptions) {
    const viewed = this.viewed.get(options.userId) ?? new Set<string>();
    return [...this.snippets.values()]
      .filter((snippet) => snippet.isPublic && snippet.moderationStatus === "approved" && snippet.reliabilityScore >= 60)
      .filter((snippet) => !options.subjects?.length || options.subjects.includes(snippet.subject))
      .filter((snippet) => !viewed.has(snippet.id))
      .sort((a, b) => b.confidenceScore + b.reliabilityScore - (a.confidenceScore + a.reliabilityScore))
      .slice(0, options.limit)
      .map(this.toPublicSnippet);
  }

  async getPublicSnippet(snippetId: string) {
    const snippet = this.snippets.get(snippetId);
    if (!snippet || !snippet.isPublic || snippet.moderationStatus !== "approved") return null;
    return this.toPublicSnippet(snippet);
  }

  async listPendingSnippets() {
    return [...this.snippets.values()].filter((snippet) => snippet.moderationStatus === "pending");
  }

  async moderateSnippet(snippetId: string, status: "approved" | "rejected", _reviewerId: string) {
    const snippet = this.snippets.get(snippetId);
    if (!snippet) return null;
    const updated: SnippetAdminRecord = { ...snippet, moderationStatus: status };
    this.snippets.set(snippetId, updated);
    return updated;
  }

  async setSourceReliability(sourceId: string, score: number) {
    const snippet = this.snippets.get(sourceId);
    if (snippet) this.snippets.set(sourceId, { ...snippet, reliabilityScore: score });
  }

  async search(options: VectorSearchOptions) {
    const query = options.query.toLowerCase();
    const ownMaterials = [...this.materials.values()]
      .filter((material) => !options.userId || material.ownerId === options.userId || material.isPublic)
      .filter((material) => [material.title, material.description, material.subject, material.tags.join(" ")].join(" ").toLowerCase().includes(query))
      .map(this.stripReliability);
    const publicSnippets = [...this.snippets.values()]
      .filter((snippet) => snippet.moderationStatus === "approved" && snippet.isPublic)
      .filter((snippet) => [snippet.title, snippet.summary, snippet.transcript, snippet.subject, snippet.tags.join(" ")].join(" ").toLowerCase().includes(query))
      .map(this.toPublicSnippet);
    return [...ownMaterials, ...publicSnippets].slice(0, options.limit);
  }

  async recordSnippetEvent(userId: string, snippetId: string, event: "viewed" | "liked" | "saved" | "reported") {
    if (event === "viewed") {
      const set = this.viewed.get(userId) ?? new Set<string>();
      set.add(snippetId);
      this.viewed.set(userId, set);
    }
    if (event === "reported") {
      const id = randomUUID();
      this.reports.set(id, { id, snippetId, reporterId: userId, reason: "User report", status: "open", createdAt: new Date().toISOString() });
    }
  }

  async listReports() {
    return [...this.reports.values()];
  }

  async updateReport(reportId: string, status: string) {
    const report = this.reports.get(reportId);
    if (report) this.reports.set(reportId, { ...report, status });
  }

  private toPublicUser(user: StoredUser): UserPublic {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  private stripReliability(material: Material & { reliabilityScore?: number }): Material {
    const { reliabilityScore: _reliabilityScore, ...safeMaterial } = material;
    return safeMaterial;
  }

  private toPublicSnippet(snippet: SnippetAdminRecord): Snippet {
    const { reliabilityScore: _reliabilityScore, supportingSources: _supportingSources, conflictingSources: _conflictingSources, ...safeSnippet } = snippet;
    return safeSnippet;
  }
}
