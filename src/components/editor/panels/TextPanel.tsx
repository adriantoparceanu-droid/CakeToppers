"use client";

import { useCallback } from "react";
import type { DesignState, TextElement } from "@/types/design";
import type { FontDTO } from "@/types/api";
import type opentype from "opentype.js";

interface Props {
  design: DesignState;
  onAddText: (fontId: string, fontName: string) => void;
  onUpdateText: (id: string, changes: Partial<TextElement>) => void;
  fonts: FontDTO[];
  loadedFonts: Map<string, opentype.Font>;
}

function LabelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 w-20 shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NumberInput({
  value, onChange, min, max, step = 0.5, unit,
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        min={min} max={max} step={step}
        className="w-full border border-gray-200 rounded px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {unit && <span className="text-xs text-gray-400">{unit}</span>}
    </div>
  );
}

export function TextPanel({ design, onAddText, onUpdateText, fonts, loadedFonts }: Props) {
  const selected = design.selectedId
    ? design.elements.find((e) => e.id === design.selectedId)
    : null;

  const selectedText = selected?.kind === "text" ? (selected as TextElement) : null;

  const defaultFontId = fonts.find((f) => f.active)?.id ?? "";
  const defaultFontName = fonts.find((f) => f.active)?.name ?? "Font";

  const update = useCallback(
    (changes: Partial<TextElement>) => {
      if (!selectedText) return;
      onUpdateText(selectedText.id, changes);
    },
    [selectedText, onUpdateText]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Text & Font</h2>
      </div>

      {/* Adaugă text */}
      <div className="px-4 py-3 border-b border-gray-100">
        {fonts.length === 0 ? (
          <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
            Nu sunt fonturi încărcate. Adaugă în Admin → Fonturi.
          </p>
        ) : (
          <button
            onClick={() => onAddText(defaultFontId, defaultFontName)}
            className="w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-sm font-medium rounded-lg border border-brand-200 transition-colors"
          >
            + Adaugă text
          </button>
        )}
      </div>

      {/* Proprietăți element selectat */}
      {selectedText ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Conținut text */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Text</label>
            <textarea
              value={selectedText.text}
              onChange={(e) => update({ text: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Scrie textul..."
            />
          </div>

          {/* Font */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Font</label>
            <div className="relative">
              <select
                value={selectedText.fontId}
                onChange={(e) => update({ fontId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {fonts.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {!loadedFonts.has(f.id) ? " (se încarcă...)" : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-2.5 text-gray-400">▾</div>
            </div>
          </div>

          {/* Mărime */}
          <LabelRow label="Mărime">
            <NumberInput
              value={selectedText.sizeMm}
              onChange={(v) => update({ sizeMm: Math.max(1, v) })}
              min={1} max={200} step={0.5} unit="mm"
            />
          </LabelRow>

          {/* Spațiere litere */}
          <LabelRow label="Spațiere">
            <NumberInput
              value={selectedText.letterSpacingMm}
              onChange={(v) => update({ letterSpacingMm: v })}
              min={-5} max={20} step={0.1} unit="mm"
            />
          </LabelRow>

          {/* Poziție X / Y */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">X (mm)</label>
              <NumberInput
                value={+selectedText.x.toFixed(1)}
                onChange={(v) => update({ x: v })}
                min={0} step={0.5}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Y (mm)</label>
              <NumberInput
                value={+selectedText.y.toFixed(1)}
                onChange={(v) => update({ y: v })}
                min={0} step={0.5}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            Adaugă text cu butonul de mai sus,<br />
            apoi click pe el pentru a-l edita.
          </p>
        </div>
      )}
    </div>
  );
}
