import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { SettingsDTO } from "@/types/api";

export async function GET() {
  const s = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!s) return NextResponse.json({ error: "Settings not found" }, { status: 404 });

  const dto: SettingsDTO = {
    maxWidthMm: s.maxWidthMm,
    maxHeightMm: s.maxHeightMm,
    cutStrokeWidthMm: s.cutStrokeWidthMm,
    brandName: s.brandName,
    logoUrl: null,
    emailDeliveryEnabled: s.emailDeliveryEnabled,
    emailDeliveryPrice: s.emailDeliveryPrice,
    emailDeliveryNote: s.emailDeliveryNote,
  };
  return NextResponse.json(dto);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    maxWidthMm:           z.number().positive().max(2000).optional(),
    maxHeightMm:          z.number().positive().max(2000).optional(),
    cutStrokeWidthMm:     z.number().positive().max(1).optional(),
    brandName:            z.string().min(1).max(100).optional(),
    emailDeliveryEnabled: z.boolean().optional(),
    emailDeliveryPrice:   z.number().min(0).max(9999).optional(),
    emailDeliveryNote:    z.string().max(300).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Date invalide" }, { status: 400 });

  const s = await prisma.settings.update({
    where: { id: "singleton" },
    data: parsed.data,
  });

  return NextResponse.json({
    maxWidthMm: s.maxWidthMm, maxHeightMm: s.maxHeightMm,
    cutStrokeWidthMm: s.cutStrokeWidthMm, brandName: s.brandName, logoUrl: null,
    emailDeliveryEnabled: s.emailDeliveryEnabled,
    emailDeliveryPrice: s.emailDeliveryPrice,
    emailDeliveryNote: s.emailDeliveryNote,
  });
}
