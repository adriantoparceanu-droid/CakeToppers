import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { ShapeDTO } from "@/types/api";

export async function GET() {
  const shapes = await prisma.shape.findMany({ orderBy: { sortOrder: "asc" } });
  const dtos: ShapeDTO[] = shapes.map((s) => ({
    id: s.id, name: s.name, slug: s.slug,
    svgPath: s.svgPath, active: s.active, sortOrder: s.sortOrder,
  }));
  return NextResponse.json(dtos);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    id:     z.string(),
    active: z.boolean().optional(),
    name:   z.string().min(1).max(50).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const { id, ...data } = parsed.data;
  const shape = await prisma.shape.update({ where: { id }, data });
  return NextResponse.json(shape);
}
