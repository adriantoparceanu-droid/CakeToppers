import fs from "fs/promises";
import path from "path";
import type { IStorage } from "./interface";

export class LocalStorage implements IStorage {
  private readonly root: string;
  private readonly baseUrl: string;

  constructor() {
    this.root = path.resolve(process.env.UPLOADS_DIR ?? "./uploads");
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }

  async save(filePath: string, data: Buffer | Uint8Array): Promise<string> {
    const full = path.join(this.root, filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return filePath;
  }

  publicUrl(storePath: string): string {
    // Fișierele locale sunt servite prin /api/files/[...path]
    return `${this.baseUrl}/api/files/${storePath}`;
  }

  async read(storePath: string): Promise<Buffer> {
    const full = path.join(this.root, storePath);
    return fs.readFile(full);
  }

  async delete(storePath: string): Promise<void> {
    const full = path.join(this.root, storePath);
    await fs.unlink(full).catch(() => {
      // Ignoră dacă fișierul nu există
    });
  }
}
