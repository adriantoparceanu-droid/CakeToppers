import type { IStorage } from "./interface";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import { SupabaseStorage } from "./supabase-storage";

let instance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!instance) {
    const provider = process.env.STORAGE_PROVIDER ?? "local";
    if (provider === "supabase") instance = new SupabaseStorage();
    else if (provider === "s3")  instance = new S3Storage();
    else                         instance = new LocalStorage();
  }
  return instance;
}

export type { IStorage };
