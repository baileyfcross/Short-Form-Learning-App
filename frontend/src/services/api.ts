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

  async viewMaterial(materialId: string) {
    const { blob } = await this.blobRequest(`/library/${materialId}/view`);
    return URL.createObjectURL(blob);
  }

  async downloadMaterial(materialId: string) {
    const { blob, filename } = await this.blobRequest(`/library/${materialId}/download`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename ?? "material";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async uploadMaterial(form: FormData) {
    return this.request<Material>("/library/upload", { method: "POST", body: form, omitJsonHeader: true });
  }

  async updateMaterial(materialId: string, patch: Partial<Pick<Material, "isPublic">>) {
    return this.request<Material>(`/library/${materialId}`, { method: "PATCH", body: JSON.stringify(patch) });
  }

  async inspectUpload(form: FormData) {
    return this.request<UploadInspection>("/library/inspect", { method: "POST", body: form, omitJsonHeader: true });
  }

  async feed(subjects: string[] = []) {
    const query = subjects.length ? `?subjects=${encodeURIComponent(subjects.join(","))}` : "";
    return this.request<Snippet[]>(`/feed${query}`);
  }

  async viewFeedSource(snippetId: string) {
    const { blob } = await this.blobRequest(`/feed/${snippetId}/source`);
    return URL.createObjectURL(blob);
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
    return this.request<AdminSnippet[]>("/admin/materials");
  }

  async viewAdminSnippetSource(snippetId: string) {
    const { blob } = await this.blobRequest(`/admin/snippets/${snippetId}/source`);
    return URL.createObjectURL(blob);
  }

  async takeDownSnippet(id: string) {
    return this.request<AdminSnippet>(`/admin/snippets/${id}/takedown`, { method: "PATCH" });
  }

  private async request<T>(path: string, init: RequestInit & { omitJsonHeader?: boolean; devUserEmail?: string } = {}) {
    const response = await this.fetchWithAuth(path, init);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(body.message ?? "Request failed");
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private async blobRequest(path: string) {
    const response = await this.fetchWithAuth(path);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(body.message ?? "Request failed");
    }

    return {
      blob: await response.blob(),
      filename: this.filenameFromDisposition(response.headers.get("content-disposition"))
    };
  }

  private async fetchWithAuth(path: string, init: RequestInit & { omitJsonHeader?: boolean; devUserEmail?: string } = {}) {
    const token = this.getToken();
    const devUserEmail = init.devUserEmail ?? this.getDevUserEmail();
    const headers = new Headers(init.headers);
    if (!init.omitJsonHeader) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (devUserEmail) headers.set("X-ShortLearn-Dev-User", devUserEmail);

    return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  }

  private filenameFromDisposition(disposition: string | null) {
    const match = disposition?.match(/filename="?([^"]+)"?/i);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  }
}
