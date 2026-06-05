import { graphRepository } from "../db/index.js";
import { notFound } from "../utils/errors.js";

export class AdminService {
  materials() {
    return graphRepository.listApprovedSnippets();
  }

  pendingSnippets() {
    return graphRepository.listPendingSnippets();
  }

  async moderateSnippet(id: string, status: "approved" | "rejected", reviewerId: string) {
    const snippet = await graphRepository.moderateSnippet(id, status, reviewerId);
    if (!snippet) throw notFound("Snippet");
    return snippet;
  }

  async takeDownSnippet(id: string, reviewerId: string) {
    const snippet = await graphRepository.moderateSnippet(id, "rejected", reviewerId);
    if (!snippet) throw notFound("Snippet");
    return snippet;
  }

  async setReliability(sourceId: string, score: number) {
    await graphRepository.setSourceReliability(sourceId, score);
    return { ok: true };
  }

  reports() {
    return graphRepository.listReports();
  }

  async updateReport(id: string, status: string) {
    await graphRepository.updateReport(id, status);
    return { ok: true };
  }

  users() {
    return graphRepository.listUsers();
  }
}

export const adminService = new AdminService();
