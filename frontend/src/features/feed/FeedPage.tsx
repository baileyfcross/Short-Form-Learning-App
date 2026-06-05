import { Heart, RefreshCw, Save } from "lucide-react";
import type { Snippet } from "@shortlearn/shared";

interface FeedPageProps {
  snippets: Snippet[];
  onRefresh: () => void;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
}

export const FeedPage = ({ snippets, onRefresh, onLike, onSave }: FeedPageProps) => (
  <section className="page-stack">
    <header className="page-header">
      <div>
        <h1>Learning feed</h1>
        <p>Approved short lessons only; reliability scoring stays internal.</p>
      </div>
      <button className="secondary-button" onClick={onRefresh}>
        <RefreshCw aria-hidden="true" />
        <span>Refresh</span>
      </button>
    </header>
    <div className="feed-grid">
      {snippets.length === 0 && <p className="empty-state">No approved feed items yet. Upload a public material and approve its generated snippet as an admin.</p>}
      {snippets.map((snippet) => (
        <article className="lesson-card" key={snippet.id}>
          <div className="media-tile">{snippet.contentType}</div>
          <div className="lesson-body">
            <span className="eyebrow">{snippet.subject}</span>
            <h2>{snippet.title}</h2>
            <p>{snippet.summary}</p>
            <div className="tag-row">{snippet.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="button-row">
              <button className="icon-text-button" onClick={() => onLike(snippet.id)}>
                <Heart aria-hidden="true" />
                <span>Like</span>
              </button>
              <button className="icon-text-button" onClick={() => onSave(snippet.id)}>
                <Save aria-hidden="true" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);
