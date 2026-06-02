// Servire fișiere din storage local (fonturi, SVG-uri)
// În producție cu S3, acest endpoint nu e necesar (fișierele au URL public direct)

import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import path from "path";

const MIME: Record<string, string> = {
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".svg":  "image/svg+xml",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const storePath = segments.join("/");

  // Sanitizare: nu permite path traversal
  if (storePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const storage = getStorage();
    const data = await storage.read(storePath);
    const ext = path.extname(storePath).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
