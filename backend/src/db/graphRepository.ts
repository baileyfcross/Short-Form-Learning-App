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

export interface GraphRepository {
  close(): Promise<void>;
  createUser(input: CreateUserInput): Promise<StoredUser>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
  findUserById(id: string): Promise<StoredUser | null>;
  listUsers(): Promise<UserPublic[]>;
  createMaterial(input: CreateMaterialInput): Promise<Material>;
  findMaterialByOwnerAndFileHash(ownerId: string, fileHash: string): Promise<Material | null>;
  listMaterialsForUser(userId: string): Promise<Material[]>;
  listAllMaterials(): Promise<Material[]>;
  getMaterialForUser(materialId: string, userId: string, isAdmin: boolean): Promise<Material | null>;
  patchMaterial(materialId: string, userId: string, patch: Partial<Material>): Promise<Material | null>;
  deleteMaterial(materialId: string, userId: string, isAdmin: boolean): Promise<boolean>;
  createSnippet(input: CreateSnippetInput): Promise<SnippetAdminRecord>;
  listFeed(options: FeedOptions): Promise<Snippet[]>;
  getPublicSnippet(snippetId: string): Promise<Snippet | null>;
  getApprovedSnippetSourceMaterial(snippetId: string): Promise<Material | null>;
  getReviewSnippetSourceMaterial(snippetId: string): Promise<Material | null>;
  listPendingSnippets(): Promise<AdminSnippet[]>;
  listApprovedSnippets(): Promise<AdminSnippet[]>;
  moderateSnippet(snippetId: string, status: "approved" | "rejected", reviewerId: string): Promise<AdminSnippet | null>;
  setSourceReliability(sourceId: string, score: number): Promise<void>;
  search(options: VectorSearchOptions): Promise<Array<Material | Snippet>>;
  recordSnippetEvent(userId: string, snippetId: string, event: "viewed" | "liked" | "saved" | "reported"): Promise<void>;
  listReports(): Promise<Array<{ id: string; snippetId: string; reporterId: string; reason: string; status: string; createdAt: string }>>;
  updateReport(reportId: string, status: string): Promise<void>;
}
