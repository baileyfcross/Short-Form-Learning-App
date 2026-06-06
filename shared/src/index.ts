export type UserRole = "user" | "moderator" | "admin";
export type MediaType = "pdf" | "document" | "audio" | "video" | "image" | "text" | "other";
export type ProcessingStatus = "queued" | "processing" | "processed" | "failed";
export type ModerationStatus = "private" | "pending" | "approved" | "rejected";
export type VerificationStatus = "unverified" | "partially_verified" | "verified" | "disputed" | "rejected";

export interface UserPublic {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  subjects: string[];
  createdAt: string;
}

export interface Material {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  mediaType: MediaType;
  subject: string;
  tags: string[];
  objectKey: string;
  sourceUrl?: string;
  originalName?: string;
  fileHash?: string;
  fileSize?: number;
  contentType?: string;
  isPublic: boolean;
  processingStatus: ProcessingStatus;
  extractedText?: string;
  uploadDate: string;
}

export interface Snippet {
  id: string;
  sourceMaterialId?: string;
  uploaderId: string;
  title: string;
  subject: string;
  tags: string[];
  summary: string;
  transcript?: string;
  contentType: "video" | "audio" | "text";
  objectKey?: string;
  citation?: string;
  confidenceScore: number;
  moderationStatus: ModerationStatus;
  verificationStatus: VerificationStatus;
  isPublic: boolean;
  createdAt: string;
  sourceMaterial?: {
    id: string;
    title: string;
    mediaType: MediaType;
  };
}

export interface AdminSnippet extends Snippet {
  reliabilityScore: number;
  supportingSources: SourceReference[];
  conflictingSources: SourceReference[];
}

export interface Fact {
  id: string;
  claimText: string;
  sourceMaterialId?: string;
  snippetId?: string;
  confidenceScore: number;
  reliabilityScore: number;
  verificationStatus: VerificationStatus;
}

export interface SourceReference {
  id: string;
  title: string;
  url?: string;
  sourceType: string;
  publisher?: string;
  reliabilityScore: number;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  message: string;
  details?: unknown;
}

export interface UploadInspection {
  title: string;
  description: string;
  subject: string;
  tags: string[];
  mediaType: MediaType;
  confidenceScore: number;
  provider: string;
  warnings: string[];
}
