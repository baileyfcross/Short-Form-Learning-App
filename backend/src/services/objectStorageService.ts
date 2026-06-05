import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Readable } from "node:stream";
import { env } from "../config/env.js";

export interface StoredObject {
  objectKey: string;
  url: string;
  size: number;
  contentType: string;
}

export interface ObjectStorageService {
  putObject(input: { stream: Readable; originalName: string; contentType: string; size: number; ownerId: string }): Promise<StoredObject>;
  deleteObject(objectKey: string): Promise<void>;
}

export class LocalObjectStorageService implements ObjectStorageService {
  async putObject(input: { stream: Readable; originalName: string; contentType: string; size: number; ownerId: string }) {
    const safeName = input.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectKey = `${input.ownerId}/${randomUUID()}-${safeName}`;
    const absoluteDir = path.resolve(env.LOCAL_STORAGE_DIR, input.ownerId);
    const absolutePath = path.resolve(env.LOCAL_STORAGE_DIR, objectKey);

    if (!absolutePath.startsWith(path.resolve(env.LOCAL_STORAGE_DIR))) {
      throw new Error("Invalid storage path");
    }

    await mkdir(absoluteDir, { recursive: true });
    await new Promise<void>((resolve, reject) => {
      const writer = createWriteStream(absolutePath);
      input.stream.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return { objectKey, url: `/objects/${objectKey}`, size: input.size, contentType: input.contentType };
  }

  async deleteObject(_objectKey: string) {
    // The local MVP keeps files for auditability. A production provider should delete or retain by policy.
  }
}

export const objectStorageService: ObjectStorageService = new LocalObjectStorageService();
