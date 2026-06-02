import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/fonts/[id] — redenumire sau toggle active
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    name:   z.string().min(1).max(100).optional(),
    active: z.boolean().optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const font = await prisma.font.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({
    id: font.id, name: font.name,
    active: font.active, createdAt: font.createdAt.toISOString(),
  });
}

// DELETE /api/fonts/[id] — șterge font + fișier
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const font = await prisma.font.findUnique({ where: { id } });
  if (!font) return NextResponse.json({ error: "Font negăsit" }, { status: 404 });

  await prisma.font.delete({ where: { id } });
  await getStorage().delete(font.storePath).catch(() => {});

  return NextResponse.json({ ok: true });
}
