// Interfața de storage — orice implementare (local / S3) trebuie să respecte contractul acesta

export interface IStorage {
  // Salvează un fișier și returnează calea internă (storePath)
  save(path: string, data: Buffer | Uint8Array, mimeType?: string): Promise<string>;

  // Returnează URL-ul public pentru un storePath
  publicUrl(storePath: string): string;

  // Citește conținutul unui fișier ca Buffer
  read(storePath: string): Promise<Buffer>;

  // Șterge un fișier
  delete(storePath: string): Promise<void>;
}
