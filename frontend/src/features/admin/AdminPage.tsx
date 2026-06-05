import { Check, ShieldAlert, X } from "lucide-react";
import type { AdminSnippet, Material } from "@shortlearn/shared";

interface AdminPageProps {
  pending: AdminSnippet[];
  materials: Material[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
}

export const AdminPage = ({ pending, materials, onApprove, onReject, onRefresh }: AdminPageProps) => (
  <section className="page-stack">
    <header className="page-header">
      <div>
        <h1>Admin dashboard</h1>
        <p>Moderation, internal reliability visibility, and review controls.</p>
      </div>
      <button className="secondary-button" onClick={onRefresh}>
        <ShieldAlert aria-hidden="true" />
        <span>Refresh</span>
      </button>
    </header>
    <div className="admin-grid">
      <section className="panel">
        <h2>Pending snippets</h2>
        {pending.length === 0 && <p className="empty-state">No snippets awaiting moderation.</p>}
        {pending.map((snippet) => (
          <article className="moderation-item" key={snippet.id}>
            <div>
              <span className="eyebrow">{snippet.subject}</span>
              <h3>{snippet.title}</h3>
              <p>{snippet.summary}</p>
              <small>Reliability: {snippet.reliabilityScore} | Confidence: {snippet.confidenceScore}</small>
            </div>
            <div className="button-row">
              <button className="icon-button" title="Approve" aria-label="Approve" onClick={() => onApprove(snippet.id)}>
                <Check aria-hidden="true" />
              </button>
              <button className="icon-button danger" title="Reject" aria-label="Reject" onClick={() => onReject(snippet.id)}>
                <X aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <h2>Uploaded materials</h2>
        <div className="compact-list">
          {materials.map((material) => (
            <div key={material.id}>
              <strong>{material.title}</strong>
              <span>{material.subject} | {material.processingStatus}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  </section>
);
