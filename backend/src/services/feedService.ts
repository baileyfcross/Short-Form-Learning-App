import { graphRepository } from "../db/index.js";
import { AppError, notFound } from "../utils/errors.js";

export class FeedService {
  async getFeed(userId: string, subjects: string[] = [], limit = 20) {
    return graphRepository.listFeed({ userId, subjects: [], limit });
  }

  async getSnippet(id: string) {
    const snippet = await graphRepository.getPublicSnippet(id);
    if (!snippet) throw notFound("Snippet");
    return snippet;
  }

  async mark(userId: string, snippetId: string, event: "viewed" | "liked" | "saved" | "reported") {
    if (!snippetId) throw new AppError(400, "Snippet id is required");
    await graphRepository.recordSnippetEvent(userId, snippetId, event);
    return { ok: true };
  }
}

export const feedService = new FeedService();
