import type { AdminSnippet, AuthResponse, Material, Snippet, UploadInspection, UserPublic } from "@shortlearn/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiClient {
  constructor(
    private getToken: () => string | undefined,
    private getDevUserEmail: () => string | undefined = () => undefined
  ) {}

  async register(input: { email: string; password: string; displayName: string; subjects: string[] }) {
    return this.request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(input) });
  }

  async login(input: { email: string; password: string }) {
    return this.request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) });
  }

  async me() {
    return this.request<UserPublic>("/auth/me");
  }

  async devLogin(email: string): Promise<AuthResponse> {
    const user = await this.request<UserPublic>("/auth/me", { devUserEmail: email });
    return { user, accessToken: "", refreshToken: "" };
  }

  async library() {
    return this.request<Material[]>("/library");
  }

  async uploadMaterial(form: FormData) {
    return this.request<Material>("/library/upload", { method: "POST", body: form, omitJsonHeader: true });
  }

  async inspectUpload(form: FormData) {
    return this.request<UploadInspection>("/library/inspect", { method: "POST", body: form, omitJsonHeader: true });
  }

  async feed(subjects: string[] = []) {
    const query = subjects.length ? `?subjects=${encodeURIComponent(subjects.join(","))}` : "";
    return this.request<Snippet[]>(`/feed${query}`);
  }

  async like(snippetId: string) {
    return this.request<{ ok: true }>(`/feed/${snippetId}/like`, { method: "POST" });
  }

  async save(snippetId: string) {
    return this.request<{ ok: true }>(`/feed/${snippetId}/save`, { method: "POST" });
  }

  async search(query: string) {
    return this.request<Array<Material | Snippet>>(`/search?q=${encodeURIComponent(query)}`);
  }

  async pendingSnippets() {
    return this.request<AdminSnippet[]>("/admin/snippets/pending");
  }

  async approveSnippet(id: string) {
    return this.request<AdminSnippet>(`/admin/snippets/${id}/approve`, { method: "PATCH" });
  }

  async rejectSnippet(id: string) {
    return this.request<AdminSnippet>(`/admin/snippets/${id}/reject`, { method: "PATCH" });
  }

  async materialsAdmin() {
    return this.request<Material[]>("/admin/materials");
  }

  private async request<T>(path: string, init: RequestInit & { omitJsonHeader?: boolean; devUserEmail?: string } = {}) {
    const token = this.getToken();
    const devUserEmail = init.devUserEmail ?? this.getDevUserEmail();
    const headers = new Headers(init.headers);
    if (!init.omitJsonHeader) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (devUserEmail) headers.set("X-ShortLearn-Dev-User", devUserEmail);

    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(body.message ?? "Request failed");
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
