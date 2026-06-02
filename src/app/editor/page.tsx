import { EditorPage } from "@/components/editor/EditorPage";
import type { SettingsDTO, FontDTO, ShapeDTO } from "@/types/api";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

async function getData() {
  const [settings, fonts, shapes] = await Promise.all([
    fetch(`${BASE}/api/settings`, { cache: "no-store" }).then(r => r.ok ? r.json() : {
      maxWidthMm:300, maxHeightMm:200, cutStrokeWidthMm:0.1, brandName:"CakeTopper Studio", logoUrl:null,
      emailDeliveryEnabled:true, emailDeliveryPrice:15,
      emailDeliveryNote:"Vei fi contactat pentru detalii de plată.",
    }) as Promise<SettingsDTO>,
    fetch(`${BASE}/api/fonts`,   { cache: "no-store" }).then(r => r.ok ? r.json() : []) as Promise<FontDTO[]>,
    fetch(`${BASE}/api/shapes`,  { cache: "no-store" }).then(r => r.ok ? r.json() : []) as Promise<ShapeDTO[]>,
  ]);
  return { settings, fonts, shapes: (shapes as ShapeDTO[]).filter(s => s.active) };
}

export default async function EditorRoute() {
  const { settings, fonts, shapes } = await getData();
  return <EditorPage settings={settings} fonts={fonts} shapes={shapes} />;
}
