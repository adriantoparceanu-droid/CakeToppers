// Storage S3-compatible — funcționează cu Supabase Storage, Cloudflare R2, AWS S3
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { IStorage } from "./interface";

export class S3Storage implements IStorage {
  private client: S3Client;
  private bucket: string;
  private publicUrl_: string;

  constructor() {
    const endpoint  = process.env.S3_ENDPOINT;
    const bucket    = process.env.S3_BUCKET;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;
    const pubUrl    = process.env.S3_PUBLIC_URL;

    if (!endpoint || !bucket || !accessKey || !secretKey || !pubUrl) {
      throw new Error(
        "S3Storage: lipsesc variabile de mediu: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL"
      );
    }

    this.bucket = bucket;
    this.publicUrl_ = pubUrl.replace(/\/$/, "");

    this.client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint,
      forcePathStyle: true, // necesar pentru Supabase și R2
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
  }

  async save(filePath: string, data: Buffer | Uint8Array, mimeType?: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: data,
        ContentType: mimeType ?? "application/octet-stream",
      })
    );
    return filePath;
  }

  publicUrl(storePath: string): string {
    return `${this.publicUrl_}/${storePath}`;
  }

  async read(storePath: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: storePath })
    );
    const stream = res.Body;
    if (!stream) throw new Error(`S3: fișier inexistent: ${storePath}`);

    // Convertim ReadableStream → Buffer
    const chunks: Uint8Array[] = [];
    const reader = (stream as ReadableStream<Uint8Array>).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
  }

  async delete(storePath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: storePath })
    ).catch(() => {}); // ignorăm dacă fișierul nu există
  }
}
