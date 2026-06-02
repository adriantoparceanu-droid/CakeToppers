import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id }, include: { font: { select: { name: true } } } });
  if (!o) return NextResponse.json({ error: "Comandă negăsită" }, { status: 404 });

  return NextResponse.json({
    id: o.id, clientName: o.clientName, clientContact: o.clientContact,
    notes: o.notes, status: o.status,
    design: JSON.parse(o.designJson),
    widthMm: o.widthMm, heightMm: o.heightMm,
    fontName: o.font?.name ?? null,
    createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    status: z.enum(["NEW", "IN_PROGRESS", "DONE"]).optional(),
    notes: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const order = await prisma.order.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ id: order.id, status: order.status });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id } });
  if (!o) return NextResponse.json({ error: "Comandă negăsită" }, { status: 404 });

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
