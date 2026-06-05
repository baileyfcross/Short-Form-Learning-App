import { graphRepository } from "../db/index.js";

export class SearchService {
  async keyword(query: string, userId: string, limit = 20) {
    return graphRepository.search({ query, userId, limit });
  }

  async vector(query: string, userId: string, subjects: string[] = [], limit = 20) {
    return graphRepository.search({ query, userId, subjects, limit });
  }
}

export const searchService = new SearchService();
