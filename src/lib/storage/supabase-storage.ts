// Storage folosind Supabase Storage REST API (nu necesită S3 credentials separate)
// Folosește service_role key pentru operații server-side.
import type { IStorage } from "./interface";

export class SupabaseStorage implements IStorage {
  private readonly url: string;      // https://[ref].supabase.co
  private readonly key: string;      // service_role key
  private readonly bucket: string;

  constructor() {
    const url    = process.env.SUPABASE_URL;
    const key    = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BUCKET ?? "caketoppers";

    if (!url || !key) {
      throw new Error("SupabaseStorage: lipsesc SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY");
    }

    this.url    = url.replace(/\/$/, "");
    this.key    = key;
    this.bucket = bucket;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.key}`,
      apikey: this.key,
    };
  }

  async save(filePath: string, data: Buffer | Uint8Array, mimeType?: string): Promise<string> {
    const res = await fetch(
      `${this.url}/storage/v1/object/${this.bucket}/${filePath}`,
      {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": mimeType ?? "application/octet-stream",
          "x-upsert": "true",   // suprascrie dacă există
        },
        body: new Uint8Array(data),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase upload failed (${res.status}): ${err}`);
    }
    return filePath;
  }

  publicUrl(storePath: string): string {
    // Bucket privat — fișierele sunt servite prin API-ul nostru, nu direct
    return `${this.url}/storage/v1/object/authenticated/${this.bucket}/${storePath}`;
  }

  async read(storePath: string): Promise<Buffer> {
    const res = await fetch(
      `${this.url}/storage/v1/object/authenticated/${this.bucket}/${storePath}`,
      { headers: this.headers }
    );
    if (!res.ok) {
      throw new Error(`Supabase read failed (${res.status}): ${storePath}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  async delete(storePath: string): Promise<void> {
    await fetch(
      `${this.url}/storage/v1/object/${this.bucket}`,
      {
        method: "DELETE",
        headers: { ...this.headers, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [storePath] }),
      }
    );
    // ignorăm erorile (fișier inexistent etc.)
  }
}
