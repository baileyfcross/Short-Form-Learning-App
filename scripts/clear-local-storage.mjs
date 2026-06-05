import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const backendRoot = path.resolve(repoRoot, "backend");
const configuredStorageDir = process.env.LOCAL_STORAGE_DIR ?? "backend/storage";
const dryRun = process.argv.includes("--dry-run");

const storagePath = path.isAbsolute(configuredStorageDir)
  ? path.resolve(configuredStorageDir)
  : path.resolve(backendRoot, configuredStorageDir);

const relativeToBackend = path.relative(backendRoot, storagePath);
const isInsideBackend = relativeToBackend && !relativeToBackend.startsWith("..") && !path.isAbsolute(relativeToBackend);

if (!isInsideBackend) {
  throw new Error(`Refusing to clear storage outside backend workspace: ${storagePath}`);
}

if (storagePath === backendRoot) {
  throw new Error("Refusing to clear the backend workspace root.");
}

if (dryRun) {
  console.log(`Would clear local backend storage: ${storagePath}`);
  process.exit(0);
}

await rm(storagePath, { recursive: true, force: true });
await mkdir(storagePath, { recursive: true });
console.log(`Cleared local backend storage: ${storagePath}`);
