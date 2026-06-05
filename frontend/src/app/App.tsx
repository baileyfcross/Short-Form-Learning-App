import { useMemo, useState } from "react";
import type { AdminSnippet, AuthResponse, Material, Snippet } from "@shortlearn/shared";
import { AdminPage } from "../features/admin/AdminPage";
import { AuthScreen } from "../features/auth/AuthScreen";
import { FeedPage } from "../features/feed/FeedPage";
import { LibraryPage } from "../features/library/LibraryPage";
import { UploadPage } from "../features/library/UploadPage";
import { SearchPage } from "../pages/SearchPage";
import { ApiClient } from "../services/api";
import { Shell } from "../components/Shell";
import type { ViewKey } from "../types";

const storedSession = () => {
  const raw = localStorage.getItem("shortlearn.session");
  return raw ? (JSON.parse(raw) as AuthResponse) : null;
};

const storedDevUserEmail = () => localStorage.getItem("shortlearn.devUserEmail");

export const App = () => {
  const [session, setSession] = useState<AuthResponse | null>(storedSession);
  const [devUserEmail, setDevUserEmail] = useState<string | null>(storedDevUserEmail);
  const [view, setView] = useState<ViewKey>("feed");
  const [feed, setFeed] = useState<Snippet[]>([]);
  const [library, setLibrary] = useState<Material[]>([]);
  const [pending, setPending] = useState<AdminSnippet[]>([]);
  const [adminMaterials, setAdminMaterials] = useState<AdminSnippet[]>([]);

  const api = useMemo(() => new ApiClient(() => session?.accessToken, () => devUserEmail ?? undefined), [devUserEmail, session?.accessToken]);

  const saveSession = (nextSession: AuthResponse) => {
    localStorage.removeItem("shortlearn.devUserEmail");
    setDevUserEmail(null);
    localStorage.setItem("shortlearn.session", JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const saveDevSession = (email: string, nextSession: AuthResponse) => {
    localStorage.setItem("shortlearn.devUserEmail", email);
    localStorage.setItem("shortlearn.session", JSON.stringify(nextSession));
    setDevUserEmail(email);
    setSession(nextSession);
  };

  const logout = () => {
    localStorage.removeItem("shortlearn.session");
    localStorage.removeItem("shortlearn.devUserEmail");
    setDevUserEmail(null);
    setSession(null);
  };

  const refreshFeed = async () => setFeed(await api.feed());
  const refreshLibrary = async () => setLibrary(await api.library());
  const refreshAdmin = async () => {
    setPending(await api.pendingSnippets());
    setAdminMaterials(await api.materialsAdmin());
  };

  const switchView = async (nextView: ViewKey) => {
    setView(nextView);
    if (nextView === "feed") await refreshFeed();
    if (nextView === "library") await refreshLibrary();
    if (nextView === "admin") await refreshAdmin();
  };

  if (!session) return <AuthScreen api={api} onSession={saveSession} onDevSession={saveDevSession} />;

  return (
    <Shell user={session.user} view={view} setView={(nextView) => void switchView(nextView)} onLogout={logout}>
      {view === "feed" && (
        <FeedPage
          snippets={feed}
          onRefresh={() => void refreshFeed()}
          onViewSource={async (id) => {
            const url = await api.viewFeedSource(id);
            window.open(url, "_blank", "noopener,noreferrer");
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
          }}
          onLike={(id) => void api.like(id)}
          onSave={(id) => void api.save(id)}
        />
      )}
      {view === "library" && (
        <LibraryPage
          materials={library}
          onView={async (material) => {
            const url = await api.viewMaterial(material.id);
            window.open(url, "_blank", "noopener,noreferrer");
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
          }}
          onDownload={(material) => void api.downloadMaterial(material.id)}
          onVisibilityChange={async (material, isPublic) => {
            await api.updateMaterial(material.id, { isPublic });
            await refreshLibrary();
            await refreshFeed();
          }}
        />
      )}
      {view === "upload" && (
        <UploadPage
          onUpload={async (form) => {
            await api.uploadMaterial(form);
            await refreshLibrary();
          }}
          onInspect={(form) => api.inspectUpload(form)}
        />
      )}
      {view === "search" && <SearchPage onSearch={(query) => api.search(query)} />}
      {view === "admin" && (
        <AdminPage
          pending={pending}
          materials={adminMaterials}
          canTakeDown={session.user.roles.includes("admin")}
          onRefresh={() => void refreshAdmin()}
          onApprove={async (id) => {
            await api.approveSnippet(id);
            await refreshAdmin();
            await refreshFeed();
          }}
          onReject={async (id) => {
            await api.rejectSnippet(id);
            await refreshAdmin();
          }}
          onViewSnippetSource={async (snippet) => {
            const url = await api.viewAdminSnippetSource(snippet.id);
            window.open(url, "_blank", "noopener,noreferrer");
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
          }}
          onTakeDown={async (id) => {
            await api.takeDownSnippet(id);
            await refreshAdmin();
            await refreshFeed();
          }}
        />
      )}
    </Shell>
  );
};
