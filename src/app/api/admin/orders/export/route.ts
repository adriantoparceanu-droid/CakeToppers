import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { getSession } from "@/lib/auth";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { ids } = z.object({ ids: z.array(z.string()).min(1).max(100) }).parse(body);

  const orders = await prisma.order.findMany({ where: { id: { in: ids } } });
  if (orders.length === 0) return NextResponse.json({ error: "Nicio comandă găsită" }, { status: 404 });

  const storage = getStorage();
  const zip = new JSZip();

  for (const order of orders) {
    try {
      const data = await storage.read(order.svgStorePath);
      const name = `${order.clientName.replace(/[^a-zA-Z0-9]/g,"_")}_${order.widthMm}x${order.heightMm}mm.svg`;
      zip.file(name, data);
    } catch { /* fișier lipsă — omitem */ }
  }

  const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="caketoppers_${orders.length}.zip"`,
    },
  });
}
