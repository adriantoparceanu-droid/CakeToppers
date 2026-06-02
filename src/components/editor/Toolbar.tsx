"use client";

import { ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from "./constants";
import type { Unit } from "@/types/design";
import type { SettingsDTO } from "@/types/api";

interface ZoomPan { scale: number; offsetX: number; offsetY: number }

interface Props {
  unit: Unit;
  setUnit: (u: Unit) => void;
  zoomPan: ZoomPan;
  setZoomPan: (zp: ZoomPan) => void;
  widthMm: number;
  heightMm: number;
  brandName: string;
  onSave: () => void;
  onFitCanvas: () => void;
  onDeleteSelected: () => void;
  hasSelection: boolean;
}

export function Toolbar({
  unit, setUnit, zoomPan, setZoomPan,
  widthMm, heightMm, brandName,
  onSave, onFitCanvas, onDeleteSelected, hasSelection,
}: Props) {
  const { scale } = zoomPan;
  const pct = Math.round(scale * 100);

  function zoom(factor: number) {
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale * factor));
    // Zoom centrat pe mijlocul viewport-ului — offsetX/Y sunt recalculate de EditorPage
    setZoomPan({ ...zoomPan, scale: newScale });
  }

  const displayW = unit === "cm" ? (widthMm / 10).toFixed(1) : widthMm.toFixed(1);
  const displayH = unit === "cm" ? (heightMm / 10).toFixed(1) : heightMm.toFixed(1);
  const unitLabel = unit === "cm" ? "cm" : "mm";

  return (
    <div className="flex items-center gap-3 px-4 h-12 bg-white border-b border-gray-200 shrink-0 select-none">
      {/* Brand */}
      <span className="font-semibold text-brand-600 text-sm mr-2">{brandName}</span>

      <div className="h-5 w-px bg-gray-200" />

      {/* Unit toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {(["mm", "cm"] as Unit[]).map((u) => (
          <button
            key={u}
            onClick={() => setUnit(u)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              unit === u
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {u}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => zoom(1 / 1.2)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-mono text-lg leading-none"
          title="Zoom out"
        >−</button>
        <span className="text-xs text-gray-600 w-10 text-center tabular-nums">{pct}%</span>
        <button
          onClick={() => zoom(1.2)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 font-mono text-lg leading-none"
          title="Zoom in"
        >+</button>
        <button
          onClick={onFitCanvas}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="Potrivește canvas în ecran"
        >
          Fit
        </button>
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Dimensiuni design */}
      {(widthMm > 0 || heightMm > 0) ? (
        <span className="text-xs text-gray-500 tabular-nums">
          <span className="font-medium text-gray-700">{displayW} × {displayH}</span>{" "}
          <span>{unitLabel}</span>
        </span>
      ) : (
        <span className="text-xs text-gray-400 italic">Design gol</span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Delete selected */}
      {hasSelection && (
        <button
          onClick={onDeleteSelected}
          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
        >
          Șterge
        </button>
      )}

      {/* Save button */}
      <button
        onClick={onSave}
        className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Salvează comanda
      </button>
    </div>
  );
}
