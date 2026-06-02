// Servire fișier font pentru opentype.js (browser + server)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const font = await prisma.font.findUnique({ where: { id } });
  if (!font) return NextResponse.json({ error: "Font negăsit" }, { status: 404 });

  const storage = getStorage();
  const data = await storage.read(font.storePath);
  const ext = path.extname(font.storePath).toLowerCase();

  const mime: Record<string, string> = {
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".woff": "font/woff",
  };

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mime[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
