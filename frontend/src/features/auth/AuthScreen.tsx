import { useState } from "react";
import { LogIn } from "lucide-react";
import type { AuthResponse } from "@shortlearn/shared";
import type { ApiClient } from "../../services/api";

interface AuthScreenProps {
  api: ApiClient;
  onSession: (session: AuthResponse) => void;
}

export const AuthScreen = ({ api, onSession }: AuthScreenProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("learner@example.com");
  const [password, setPassword] = useState("ChangeMe12345");
  const [displayName, setDisplayName] = useState("Curious Learner");
  const [subjects, setSubjects] = useState("Science, History, Language");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const session =
        mode === "login"
          ? await api.login({ email, password })
          : await api.register({ email, password, displayName, subjects: subjects.split(",").map((subject) => subject.trim()).filter(Boolean) });
      onSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate");
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <div>
          <h1>ShortLearn</h1>
          <p>Build a private learning library and review approved short lessons across science, languages, history, and the arts.</p>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <div className="segmented" role="tablist" aria-label="Authentication mode">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
              Login
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
              Sign up
            </button>
          </div>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={12} />
          </label>
          {mode === "register" && (
            <>
              <label>
                Display name
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              </label>
              <label>
                Subjects
                <input value={subjects} onChange={(event) => setSubjects(event.target.value)} />
              </label>
            </>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="primary-button" type="submit">
            <LogIn aria-hidden="true" />
            <span>{mode === "login" ? "Login" : "Create account"}</span>
          </button>
        </form>
      </section>
    </main>
  );
};
