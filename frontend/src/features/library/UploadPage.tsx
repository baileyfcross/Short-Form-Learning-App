import { Upload } from "lucide-react";
import { useState } from "react";

interface UploadPageProps {
  onUpload: (formData: FormData) => Promise<void>;
}

export const UploadPage = ({ onUpload }: UploadPageProps) => {
  const [isPublic, setIsPublic] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    form.set("isPublic", String(isPublic));
    await onUpload(form);
    event.currentTarget.reset();
    setMessage("Upload queued for processing.");
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Upload material</h1>
          <p>Files are stored outside Neo4j; graph nodes keep metadata, ownership, and processing state.</p>
        </div>
      </header>
      <form className="upload-form" onSubmit={submit}>
        <label>
          File
          <input name="file" type="file" required />
        </label>
        <label>
          Title
          <input name="title" placeholder="Introduction to cell biology" required />
        </label>
        <label>
          Description
          <textarea name="description" rows={4} />
        </label>
        <label>
          Subject
          <select name="subject" defaultValue="Science">
            <option>Science</option>
            <option>Language</option>
            <option>History</option>
            <option>Creative Arts</option>
          </select>
        </label>
        <label>
          Tags
          <input name="tags" placeholder="biology, cells, foundations" />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
          Generate public snippet candidates
        </label>
        {message && <p className="success-text">{message}</p>}
        <button className="primary-button" type="submit">
          <Upload aria-hidden="true" />
          <span>Upload</span>
        </button>
      </form>
    </section>
  );
};
