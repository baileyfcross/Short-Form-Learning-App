import { BookOpen, Library, LogOut, Search, ShieldCheck, Upload, Video } from "lucide-react";
import type { ReactNode } from "react";
import type { UserPublic } from "@shortlearn/shared";
import type { ViewKey } from "../types";

interface ShellProps {
  user: UserPublic;
  view: ViewKey;
  setView: (view: ViewKey) => void;
  onLogout: () => void;
  children: ReactNode;
}

const nav = [
  { key: "feed", label: "Feed", icon: Video },
  { key: "library", label: "Library", icon: Library },
  { key: "upload", label: "Upload", icon: Upload },
  { key: "search", label: "Search", icon: Search },
  { key: "admin", label: "Admin", icon: ShieldCheck }
] as const;

export const Shell = ({ user, view, setView, onLogout, children }: ShellProps) => {
  const canAdmin = user.roles.includes("admin") || user.roles.includes("moderator");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BookOpen aria-hidden="true" />
          <span>ShortLearn</span>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {nav
            .filter((item) => item.key !== "admin" || canAdmin)
            .map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} className={view === item.key ? "active" : ""} onClick={() => setView(item.key)}>
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </nav>
        <div className="account-strip">
          <div>
            <strong>{user.displayName}</strong>
            <span>{user.roles.join(", ")}</span>
          </div>
          <button className="icon-button" title="Log out" aria-label="Log out" onClick={onLogout}>
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
};
