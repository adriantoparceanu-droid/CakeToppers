"use client";

import { useCallback } from "react";
import type { DesignState, TextElement, ShapeElement } from "@/types/design";
import type { FontDTO, ShapeDTO } from "@/types/api";
import type opentype from "opentype.js";

type LayerOp = "front" | "forward" | "backward" | "back";

interface Props {
  design: DesignState;
  fonts: FontDTO[];
  shapes: ShapeDTO[];
  loadedFonts: Map<string, opentype.Font>;
  onAddText:      (fontId: string, fontName: string) => void;
  onAddShape:     (slug: string) => void;
  onUpdateText:   (id: string, changes: Partial<TextElement>) => void;
  onUpdateShape:  (id: string, changes: Partial<ShapeElement>) => void;
  onReorder:      (id: string, op: LayerOp) => void;
}

const SHAPE_ICONS: Record<string, string> = {
  stick: "🏮", heart: "❤️", circle: "⭕", star: "⭐",
};

function Num({ label, value, onChange, min, max, step = 0.5, unit }:
  { label:string; value:number; onChange:(v:number)=>void; min?:number; max?:number; step?:number; unit?:string }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 w-20 shrink-0">{label}</label>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => { const v=parseFloat(e.target.value); if(!isNaN(v)) onChange(v); }}
        className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"/>
      {unit && <span className="text-xs text-gray-400">{unit}</span>}
    </div>
  );
}

export function ElementPanel({ design, fonts, shapes, loadedFonts,
  onAddText, onAddShape, onUpdateText, onUpdateShape, onReorder }: Props) {

  const sel = design.selectedId
    ? design.elements.find(e => e.id === design.selectedId)
    : null;
  const selText  = sel?.kind === "text"  ? (sel as TextElement)  : null;
  const selShape = sel?.kind === "shape" ? (sel as ShapeElement) : null;

  const defaultFont = fonts.find(f => f.active);
  const selIdx      = design.elements.findIndex(e => e.id === design.selectedId);
  const isTop       = selIdx === design.elements.length - 1;
  const isBottom    = selIdx === 0;

  const updT = useCallback((changes: Partial<TextElement>) => {
    if (selText) onUpdateText(selText.id, changes);
  }, [selText, onUpdateText]);

  const updS = useCallback((changes: Partial<ShapeElement>) => {
    if (selShape) onUpdateShape(selShape.id, changes);
  }, [selShape, onUpdateShape]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header acțiuni adăugare */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Adaugă</p>
        <div className="space-y-2">
          {/* Text */}
          {fonts.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
              Nu sunt fonturi. Adaugă în Admin → Fonturi.
            </p>
          ) : (
            <button onClick={() => onAddText(defaultFont!.id, defaultFont!.name)}
              className="w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-medium rounded-lg border border-brand-200 transition-colors">
              + Text
            </button>
          )}

          {/* Forme */}
          {shapes.filter(s => s.active).length > 0 && (
            <div className="grid grid-cols-4 gap-1">
              {shapes.filter(s => s.active).map(shape => (
                <button key={shape.id} onClick={() => onAddShape(shape.slug)}
                  title={shape.name}
                  className="py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xl border border-gray-200 transition-colors">
                  {SHAPE_ICONS[shape.slug] ?? "◻️"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Proprietăți element selectat */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Arrange (layere) ── */}
        {sel && (
          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Aranjare</p>
            <div className="grid grid-cols-4 gap-1">
              {([
                { op: "front"    as LayerOp, label: "⬆⬆", title: "Bring to Front",   disabled: isTop    },
                { op: "forward"  as LayerOp, label: "⬆",   title: "Bring Forward",    disabled: isTop    },
                { op: "backward" as LayerOp, label: "⬇",   title: "Send Backward",    disabled: isBottom },
                { op: "back"     as LayerOp, label: "⬇⬇", title: "Send to Back",     disabled: isBottom },
              ]).map(({ op, label, title, disabled }) => (
                <button key={op}
                  onClick={() => sel && onReorder(sel.id, op)}
                  disabled={disabled}
                  title={title}
                  className="py-1.5 text-sm font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-300 mt-1 text-center">
              Layer {design.elements.length - selIdx} / {design.elements.length}
            </p>
          </div>
        )}

        {selText && (
          <div className="px-4 py-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Text</p>

            <textarea value={selText.text} rows={2}
              onChange={e => updT({ text: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"/>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Font</label>
              <div className="relative">
                <select value={selText.fontId} onChange={e => updT({ fontId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {fonts.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}{!loadedFonts.has(f.id) ? " ..." : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 top-2.5 text-gray-400">▾</div>
              </div>
            </div>

            {/* Aliniere */}
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Aliniere</label>
              <div className="flex gap-1">
                {(["left","center","right"] as const).map(a => (
                  <button key={a} onClick={() => updT({ align: a })}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selText.align === a
                        ? "bg-brand-600 text-white border-brand-600"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}>
                    {a === "left" ? "⬛▪▪" : a === "center" ? "▪⬛▪" : "▪▪⬛"}
                  </button>
                ))}
              </div>
            </div>

            <Num label="Mărime" value={selText.sizeMm} onChange={v => updT({ sizeMm: Math.max(1,v) })} min={1} max={200} unit="mm"/>
            <Num label="Spațiere" value={selText.letterSpacingMm} onChange={v => updT({ letterSpacingMm: v })} min={-10} max={30} step={0.1} unit="mm"/>

            {/* Arc text */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Arc</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs tabular-nums text-gray-500 w-12 text-right">
                    {selText.arcDeg > 0 ? "+" : ""}{selText.arcDeg.toFixed(0)}°
                  </span>
                  {selText.arcDeg !== 0 && (
                    <button onClick={() => updT({ arcDeg: 0 })}
                      className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                  )}
                </div>
              </div>
              <input type="range" min={-180} max={180} step={1}
                value={selText.arcDeg}
                onChange={e => updT({ arcDeg: parseFloat(e.target.value) })}
                className="w-full accent-brand-600"/>
              <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                <span>↓ -180°</span><span>0°</span><span>+180° ↑</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Num label="X" value={+selText.x.toFixed(1)} onChange={v => updT({ x: v })} min={0} step={0.5} unit="mm"/>
              <Num label="Y" value={+selText.y.toFixed(1)} onChange={v => updT({ y: v })} min={0} step={0.5} unit="mm"/>
            </div>
          </div>
        )}

        {selShape && (
          <div className="px-4 py-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {SHAPE_ICONS[selShape.slug] ?? "◻️"} {selShape.slug.charAt(0).toUpperCase() + selShape.slug.slice(1)}
            </p>

            <Num label="Lățime" value={+selShape.widthMm.toFixed(1)} onChange={v => updS({ widthMm: Math.max(2,v) })} min={2} max={500} unit="mm"/>
            <Num label="Înălțime" value={+selShape.heightMm.toFixed(1)} onChange={v => updS({ heightMm: Math.max(2,v) })} min={2} max={500} unit="mm"/>

            <div className="grid grid-cols-2 gap-2">
              <Num label="X" value={+selShape.x.toFixed(1)} onChange={v => updS({ x: v })} min={0} step={0.5} unit="mm"/>
              <Num label="Y" value={+selShape.y.toFixed(1)} onChange={v => updS({ y: v })} min={0} step={0.5} unit="mm"/>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <strong>Sfat LightBurn:</strong> selectează textul + forma și aplică <em>Weld</em>
              pentru o singură piesă tăiată.
            </div>
          </div>
        )}

        {!sel && (
          <div className="flex items-center justify-center h-full p-6 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              Adaugă un element de mai sus,<br/>
              apoi click pe el pentru a-l edita.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
