import type { IStorage } from "./interface";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";

let instance: IStorage | null = null;

export function getStorage(): IStorage {
  if (!instance) {
    const provider = process.env.STORAGE_PROVIDER ?? "local";
    instance = provider === "s3" ? new S3Storage() : new LocalStorage();
  }
  return instance;
}

export type { IStorage };
