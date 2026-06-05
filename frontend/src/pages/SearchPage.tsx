import { Search } from "lucide-react";
import { useState } from "react";
import type { Material, Snippet } from "@shortlearn/shared";

export const SearchPage = ({ onSearch }: { onSearch: (query: string) => Promise<Array<Material | Snippet>> }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<Material | Snippet>>([]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResults(await onSearch(query));
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Search</h1>
          <p>Keyword search today; vector search hooks are in the API and Neo4j schema.</p>
        </div>
      </header>
      <form className="search-bar" onSubmit={submit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your library and approved lessons" required />
        <button className="primary-button" type="submit">
          <Search aria-hidden="true" />
          <span>Search</span>
        </button>
      </form>
      <div className="result-list">
        {results.map((item) => (
          <article key={item.id} className="result-item">
            <span className="eyebrow">{"mediaType" in item ? item.mediaType : item.contentType}</span>
            <h2>{item.title}</h2>
            <p>{"summary" in item ? item.summary : item.description ?? item.subject}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
