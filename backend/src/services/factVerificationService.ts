import type { FactVerificationResult } from "../types/internal.js";

export interface FactVerificationService {
  verifyClaim(claimText: string): Promise<FactVerificationResult>;
}

export class MockFactVerificationService implements FactVerificationService {
  async verifyClaim(_claimText: string): Promise<FactVerificationResult> {
    return {
      verificationStatus: "unverified",
      confidenceScore: 0.55,
      supportingSources: [],
      conflictingSources: []
    };
  }
}

export const factVerificationService = new MockFactVerificationService();
