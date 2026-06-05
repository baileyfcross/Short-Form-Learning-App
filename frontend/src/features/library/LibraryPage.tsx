import { FileText } from "lucide-react";
import type { Material } from "@shortlearn/shared";

export const LibraryPage = ({ materials }: { materials: Material[] }) => (
  <section className="page-stack">
    <header className="page-header">
      <div>
        <h1>Personal library</h1>
        <p>Private by default. Public snippets still require moderation.</p>
      </div>
    </header>
    <div className="table-panel">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Visibility</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((material) => (
            <tr key={material.id}>
              <td>
                <FileText aria-hidden="true" />
                {material.title}
              </td>
              <td>{material.mediaType}</td>
              <td>{material.subject}</td>
              <td>{material.processingStatus}</td>
              <td>{material.isPublic ? "snippet candidates" : "private"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {materials.length === 0 && <p className="empty-state">Your library is empty.</p>}
    </div>
  </section>
);
