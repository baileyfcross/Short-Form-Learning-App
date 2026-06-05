import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  displayName: z.string().min(1).max(80),
  subjects: z.array(z.string().min(1).max(60)).max(12).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const materialPatchSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(1000).optional(),
  subject: z.string().min(1).max(80).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  isPublic: z.boolean().optional()
});

export const querySearchSchema = z.object({
  q: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const vectorSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  subjects: z.array(z.string()).default([]),
  limit: z.number().int().min(1).max(50).default(20)
});

export const reliabilitySchema = z.object({
  score: z.number().min(0).max(100)
});

export const reportStatusSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"])
});
