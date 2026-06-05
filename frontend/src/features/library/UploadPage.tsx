import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { UploadInspection } from "@shortlearn/shared";

interface UploadPageProps {
  onUpload: (formData: FormData) => Promise<void>;
  onInspect: (formData: FormData) => Promise<UploadInspection>;
}

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
const limitWords = (value: string, limit: number) => value.trim().split(/\s+/).filter(Boolean).slice(0, limit).join(" ");
const normalizeTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join(", ");

export const UploadPage = ({ onUpload, onInspect }: UploadPageProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Science");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [inspectionMessage, setInspectionMessage] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inspectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setMessage(null);
    setError(null);
    setWarnings([]);
    setInspectionMessage(null);
    if (!file) return;

    const form = new FormData();
    form.set("file", file);
    setInspecting(true);
    try {
      const result = await onInspect(form);
      setTitle((current) => current || result.title);
      setDescription((current) => current || result.description);
      setSubject(result.subject);
      setTags((current) => normalizeTags([current, result.tags.join(", ")].filter(Boolean).join(", ")));
      setWarnings(result.warnings);
      setInspectionMessage(`Detected ${result.mediaType} with ${result.provider}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to inspect file");
    } finally {
      setInspecting(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (countWords(title) > 40) {
      setError("Title must be 40 words or fewer.");
      return;
    }
    if (countWords(description) > 1500) {
      setError("Description must be 1500 words or fewer.");
      return;
    }
    if (tags.split(",").map((tag) => tag.trim()).filter(Boolean).length > 20) {
      setError("Tags must be 20 comma-separated terms or fewer.");
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    form.set("isPublic", String(isPublic));
    form.set("title", limitWords(title, 40));
    form.set("description", limitWords(description, 1500));
    form.set("subject", subject);
    form.set("tags", normalizeTags(tags));
    try {
      await onUpload(form);
      formRef.current?.reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTitle("");
      setDescription("");
      setSubject("Science");
      setTags("");
      setIsPublic(false);
      setWarnings([]);
      setInspectionMessage(null);
      setMessage("Upload queued for processing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <h1>Upload material</h1>
          <p>Files are stored outside Neo4j; graph nodes keep metadata, ownership, and processing state.</p>
        </div>
      </header>
      <form className="upload-form" ref={formRef} onSubmit={submit}>
        <label>
          File
          <input name="file" ref={fileInputRef} type="file" required onChange={(event) => void inspectFile(event)} />
        </label>
        {inspecting && <p className="muted-text">Inspecting file metadata...</p>}
        {inspectionMessage && <p className="success-text">{inspectionMessage}</p>}
        {warnings.length > 0 && (
          <div className="warning-panel">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}
        <label>
          Title
          <input name="title" value={title} onChange={(event) => setTitle(limitWords(event.target.value, 40))} placeholder="Introduction to cell biology" required />
          <span className="field-hint">{countWords(title)} / 40 words</span>
        </label>
        <label>
          Description
          <textarea name="description" value={description} onChange={(event) => setDescription(limitWords(event.target.value, 1500))} rows={4} />
          <span className="field-hint">{countWords(description)} / 1500 words</span>
        </label>
        <label>
          Subject
          <select name="subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
            <option>Science</option>
            <option>Language</option>
            <option>History</option>
            <option>Creative Arts</option>
          </select>
        </label>
        <label>
          Tags
          <input name="tags" value={tags} onChange={(event) => setTags(normalizeTags(event.target.value))} placeholder="biology, cells, foundations" />
          <span className="field-hint">{tags.split(",").map((tag) => tag.trim()).filter(Boolean).length} / 20 comma-separated terms</span>
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
          Generate public snippet candidates
        </label>
        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}
        <button className="primary-button" type="submit">
          <Upload aria-hidden="true" />
          <span>Upload</span>
        </button>
      </form>
    </section>
  );
};
