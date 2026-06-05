import type { Material, Snippet, SourceReference, UserPublic, UserRole, VerificationStatus } from "@shortlearn/shared";

export interface StoredUser extends UserPublic {
  passwordHash: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
  roles?: UserRole[];
  subjects?: string[];
}

export interface CreateMaterialInput {
  ownerId: string;
  title: string;
  description?: string;
  mediaType: Material["mediaType"];
  subject: string;
  tags: string[];
  objectKey: string;
  sourceUrl?: string;
  isPublic?: boolean;
}

export interface CreateSnippetInput {
  sourceMaterialId?: string;
  uploaderId: string;
  title: string;
  subject: string;
  tags: string[];
  summary: string;
  transcript?: string;
  contentType: Snippet["contentType"];
  objectKey?: string;
  citation?: string;
  confidenceScore: number;
  reliabilityScore: number;
  isPublic: boolean;
}

export interface SnippetAdminRecord extends Snippet {
  reliabilityScore: number;
  supportingSources: SourceReference[];
  conflictingSources: SourceReference[];
}

export interface FeedOptions {
  userId: string;
  subjects?: string[];
  limit: number;
}

export interface VectorSearchOptions {
  query: string;
  userId?: string;
  subjects?: string[];
  limit: number;
}

export interface FactVerificationResult {
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  supportingSources: SourceReference[];
  conflictingSources: SourceReference[];
}
