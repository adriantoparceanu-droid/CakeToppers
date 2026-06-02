import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Comandă negăsită" }, { status: 404 });

  const data = await getStorage().read(order.svgStorePath);
  const filename = `${order.clientName.replace(/[^a-zA-Z0-9]/g, "_")}_${order.widthMm}x${order.heightMm}mm.svg`
    .replace(/_+/g, "_");

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
