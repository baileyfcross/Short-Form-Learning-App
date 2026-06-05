import { Download, Eye, FileText } from "lucide-react";
import type { Material } from "@shortlearn/shared";

export const LibraryPage = ({
  materials,
  onView,
  onDownload
}: {
  materials: Material[];
  onView: (material: Material) => void;
  onDownload: (material: Material) => void;
}) => (
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
            <th>Actions</th>
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
              <td>
                <div className="table-actions">
                  <button className="icon-button" title="View" aria-label={`View ${material.title}`} onClick={() => onView(material)}>
                    <Eye aria-hidden="true" />
                  </button>
                  <button className="icon-button" title="Download" aria-label={`Download ${material.title}`} onClick={() => onDownload(material)}>
                    <Download aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {materials.length === 0 && <p className="empty-state">Your library is empty.</p>}
    </div>
  </section>
);
