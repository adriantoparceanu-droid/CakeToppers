import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { z } from "zod";
import path from "path";
import type { FontDTO } from "@/types/api";

// GET /api/fonts        — fonturi active (editor public)
// GET /api/fonts?all=1  — toate fonturile (admin)
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  const fonts = await prisma.font.findMany({
    where: all ? undefined : { active: true },
    orderBy: { createdAt: "asc" },
  });

  const dtos: FontDTO[] = fonts.map((f) => ({
    id: f.id,
    name: f.name,
    active: f.active,
    createdAt: f.createdAt.toISOString(),
  }));

  return NextResponse.json(dtos);
}

// POST /api/fonts — upload font nou (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;

  if (!file || !name?.trim()) {
    return NextResponse.json({ error: "Lipsesc câmpurile: file, name" }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (![".ttf", ".otf", ".woff"].includes(ext)) {
    return NextResponse.json(
      { error: "Format nesuportat. Acceptăm .ttf, .otf, .woff" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = getStorage();
  const storePath = `fonts/${crypto.randomUUID()}${ext}`;
  await storage.save(storePath, buffer);

  const font = await prisma.font.create({
    data: { name: name.trim(), storePath, active: true },
  });

  return NextResponse.json(
    { id: font.id, name: font.name, active: font.active, createdAt: font.createdAt.toISOString() },
    { status: 201 }
  );
}
