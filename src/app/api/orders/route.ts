import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import { generateSVG } from "@/lib/svg/generator";
import type { DesignState } from "@/types/design";
import opentype from "opentype.js";

// GET /api/orders — admin: toate comenzile
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { font: { select: { name: true } } },
  });

  return NextResponse.json(orders.map(o => ({
    id: o.id, clientName: o.clientName, clientContact: o.clientContact,
    notes: o.notes, status: o.status, widthMm: o.widthMm, heightMm: o.heightMm,
    fontName: o.font?.name ?? null,
    deliveryEmail: o.deliveryEmail, deliveryPrice: o.deliveryPrice,
    createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
  })));
}

const createSchema = z.object({
  clientName:    z.string().min(1).max(100),
  clientContact: z.string().min(1).max(200),
  notes:         z.string().max(500).optional(),
  design:        z.record(z.unknown()),
  widthMm:       z.number().positive(),
  heightMm:      z.number().positive(),
  fontId:        z.string().optional(),
  deliveryEmail: z.string().email().optional(),
  deliveryPrice: z.number().min(0).optional(),
});

// POST /api/orders — client: creare comandă
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const { clientName, clientContact, notes, design, widthMm, heightMm, fontId, deliveryEmail, deliveryPrice } = parsed.data;

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) return NextResponse.json({ error: "Settings lipsesc" }, { status: 500 });

  const storage = getStorage();
  const fontMap: Record<string, opentype.Font> = {};
  const activeFonts = await prisma.font.findMany({ where: { active: true } });
  for (const font of activeFonts) {
    try {
      const buf = await storage.read(font.storePath);
      fontMap[font.id] = opentype.parse(buf.buffer as ArrayBuffer);
    } catch { /* font corupt */ }
  }

  const settingsDTO = {
    maxWidthMm: settings.maxWidthMm, maxHeightMm: settings.maxHeightMm,
    cutStrokeWidthMm: settings.cutStrokeWidthMm, brandName: settings.brandName, logoUrl: null,
    emailDeliveryEnabled: settings.emailDeliveryEnabled,
    emailDeliveryPrice: settings.emailDeliveryPrice,
    emailDeliveryNote: settings.emailDeliveryNote,
  };

  const { svg, warnings } = generateSVG(design as unknown as DesignState, fontMap, settingsDTO, clientName);
  if (!svg) return NextResponse.json({ error: "Design invalid sau fonturi lipsă.", warnings }, { status: 422 });

  const svgPath = `orders/${crypto.randomUUID()}.svg`;
  await storage.save(svgPath, Buffer.from(svg, "utf-8"));

  const order = await prisma.order.create({
    data: {
      clientName, clientContact, notes: notes ?? null,
      status: "NEW", designJson: JSON.stringify(design),
      svgStorePath: svgPath, widthMm, heightMm, fontId: fontId ?? null,
      deliveryEmail: deliveryEmail ?? null,
      deliveryPrice: deliveryPrice ?? null,
    },
  });

  return NextResponse.json({ id: order.id, warnings }, { status: 201 });
}
