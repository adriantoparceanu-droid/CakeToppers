// Stub pentru Cloudflare R2 / AWS S3 — activat când STORAGE_PROVIDER=s3
// Implementare completă necesită pachetul @aws-sdk/client-s3

import type { IStorage } from "./interface";

export class S3Storage implements IStorage {
  constructor() {
    const required = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_PUBLIC_URL"];
    for (const key of required) {
      if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
    }
    // TODO: inițializează S3Client din @aws-sdk/client-s3
  }

  async save(_filePath: string, _data: Buffer | Uint8Array): Promise<string> {
    throw new Error("S3Storage: not implemented yet. Install @aws-sdk/client-s3.");
  }

  publicUrl(storePath: string): string {
    return `${process.env.S3_PUBLIC_URL}/${storePath}`;
  }

  async read(_storePath: string): Promise<Buffer> {
    throw new Error("S3Storage: not implemented yet.");
  }

  async delete(_storePath: string): Promise<void> {
    throw new Error("S3Storage: not implemented yet.");
  }
}
