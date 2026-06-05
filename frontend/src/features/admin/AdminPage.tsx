import { Check, Eye, ShieldAlert, X } from "lucide-react";
import type { AdminSnippet } from "@shortlearn/shared";

interface AdminPageProps {
  pending: AdminSnippet[];
  materials: AdminSnippet[];
  canTakeDown: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewSnippetSource: (snippet: AdminSnippet) => void;
  onTakeDown: (id: string) => void;
  onRefresh: () => void;
}

export const AdminPage = ({ pending, materials, canTakeDown, onApprove, onReject, onViewSnippetSource, onTakeDown, onRefresh }: AdminPageProps) => (
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
              {snippet.sourceMaterial && (
                <button className="icon-button" title="View file" aria-label={`View ${snippet.sourceMaterial.title}`} onClick={() => onViewSnippetSource(snippet)}>
                  <Eye aria-hidden="true" />
                </button>
              )}
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
        <h2>Approved public items</h2>
        {materials.length === 0 && <p className="empty-state">No approved public items.</p>}
        <div className="compact-list">
          {materials.map((snippet) => (
            <div className="review-material-row" key={snippet.id}>
              <div>
                <strong>{snippet.sourceMaterial?.title ?? snippet.title}</strong>
                <span>{snippet.subject} | approved public feed item</span>
              </div>
              <div className="button-row">
                {snippet.sourceMaterial && (
                  <button className="icon-button" title="View file" aria-label={`View ${snippet.sourceMaterial.title}`} onClick={() => onViewSnippetSource(snippet)}>
                    <Eye aria-hidden="true" />
                  </button>
                )}
                {canTakeDown && (
                  <button className="icon-button danger" title="Take down" aria-label={`Take down ${snippet.title}`} onClick={() => onTakeDown(snippet.id)}>
                    <X aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  </section>
);
