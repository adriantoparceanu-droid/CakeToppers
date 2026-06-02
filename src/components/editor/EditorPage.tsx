"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type opentype from "opentype.js";
import { useDesign } from "./hooks/useDesign";
import { Toolbar } from "./Toolbar";
import { RulerH } from "./RulerH";
import { RulerV } from "./RulerV";
import { ElementPanel } from "./panels/ElementPanel";
import { SaveOrderModal } from "./panels/SaveOrderModal";
import { getDesignBounds } from "@/lib/svg/generator";
import { RULER_SIZE, MM_TO_PX } from "./constants";
import type { SettingsDTO, FontDTO, ShapeDTO } from "@/types/api";

const EditorCanvas = dynamic(() => import("./EditorCanvas"), { ssr: false });

interface ZoomPan { scale: number; offsetX: number; offsetY: number }
interface Props { settings: SettingsDTO; fonts: FontDTO[]; shapes: ShapeDTO[] }

export function EditorPage({ settings, fonts, shapes }: Props) {
  const {
    design, addText, addShape, updateText, updateShape,
    moveElement, reorderElement, selectElement, deleteSelected, setUnit,
  } = useDesign();

  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [zoomPan, setZoomPan]       = useState<ZoomPan>({ scale: 1, offsetX: 30, offsetY: 30 });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loadedFonts, setLoadedFonts] = useState<Map<string, opentype.Font>>(new Map());

  // Resize observer pe container
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Fit canvas la prima afișare
  useEffect(() => {
    if (canvasSize.width < 100) return;
    fitCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width]);

  function fitCanvas() {
    const pad = 40;
    const scaleW = (canvasSize.width  - pad*2) / (settings.maxWidthMm  * MM_TO_PX);
    const scaleH = (canvasSize.height - pad*2) / (settings.maxHeightMm * MM_TO_PX);
    const s = Math.min(scaleW, scaleH, 4);
    const pw = settings.maxWidthMm  * MM_TO_PX * s;
    const ph = settings.maxHeightMm * MM_TO_PX * s;
    setZoomPan({ scale: s, offsetX: (canvasSize.width-pw)/2, offsetY: (canvasSize.height-ph)/2 });
  }

  // Încarcă fonturile cu opentype.js
  useEffect(() => {
    if (fonts.length === 0) return;
    let cancelled = false;
    (async () => {
      const { default: opentype } = await import("opentype.js");
      const map = new Map<string, opentype.Font>();
      for (const font of fonts) {
        try {
          const buf = await (await fetch(`/api/fonts/${font.id}/file`)).arrayBuffer();
          map.set(font.id, opentype.parse(buf));
        } catch { /* font corupt — ignorăm */ }
      }
      if (!cancelled) setLoadedFonts(map);
    })();
    return () => { cancelled = true; };
  }, [fonts]);

  const bounds = getDesignBounds(design, Object.fromEntries(loadedFonts));

  // Delete cu tastatură
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (tag !== "INPUT" && tag !== "TEXTAREA") deleteSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected]);

  const handleSetZoomPan = useCallback((zp: ZoomPan) => setZoomPan(zp), []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Toolbar
        unit={design.unit} setUnit={setUnit}
        zoomPan={zoomPan} setZoomPan={setZoomPan}
        widthMm={bounds.widthMm} heightMm={bounds.heightMm}
        brandName={settings.brandName}
        onSave={() => setShowSaveModal(true)}
        onFitCanvas={fitCanvas}
        onDeleteSelected={deleteSelected}
        hasSelection={!!design.selectedId}
      />

      <div className="flex flex-1 min-h-0">
        {/* Canvas + rigla */}
        <div className="flex-1 relative min-w-0 overflow-hidden">
          <div className="absolute top-0 left-0 z-10 bg-gray-100 border-r border-b border-gray-200"
            style={{ width: RULER_SIZE, height: RULER_SIZE }}/>
          <div className="absolute top-0 z-10 overflow-hidden"
            style={{ left: RULER_SIZE, right: 0, height: RULER_SIZE }}>
            <RulerH width={canvasSize.width - RULER_SIZE} offsetX={zoomPan.offsetX}
              scale={zoomPan.scale} unit={design.unit}/>
          </div>
          <div className="absolute left-0 z-10 overflow-hidden"
            style={{ top: RULER_SIZE, bottom: 0, width: RULER_SIZE }}>
            <RulerV height={canvasSize.height - RULER_SIZE} offsetY={zoomPan.offsetY}
              scale={zoomPan.scale} unit={design.unit}/>
          </div>
          <div ref={containerRef} className="absolute"
            style={{ top: RULER_SIZE, left: RULER_SIZE, right: 0, bottom: 0 }}>
            {canvasSize.width > 10 && (
              <EditorCanvas
                design={design} settings={settings}
                loadedFonts={loadedFonts} zoomPan={zoomPan}
                setZoomPan={handleSetZoomPan}
                stageWidth={canvasSize.width} stageHeight={canvasSize.height}
                onSelectElement={selectElement} onMoveElement={moveElement}
                onUpdateText={updateText} onUpdateShape={updateShape}
              />
            )}
          </div>
        </div>

        {/* Panou dreapta */}
        <div className="shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden"
          style={{ width: 272 }}>
          <ElementPanel
            design={design} fonts={fonts} shapes={shapes}
            loadedFonts={loadedFonts}
            onAddText={addText} onAddShape={addShape}
            onUpdateText={updateText} onUpdateShape={updateShape}
            onReorder={reorderElement}
          />
        </div>
      </div>

      {showSaveModal && (
        <SaveOrderModal
          design={design} settings={settings}
          fonts={fonts} loadedFonts={loadedFonts}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
