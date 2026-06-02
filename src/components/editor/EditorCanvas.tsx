"use client";

import { Stage, Layer, Rect, Path, Group, Line, Circle } from "react-konva";
import { useCallback, useState } from "react";
import type Konva from "konva";
import type opentype from "opentype.js";
import { MM_TO_PX, MIN_ZOOM, MAX_ZOOM } from "./constants";
import type { DesignState, TextElement, ShapeElement } from "@/types/design";
import type { SettingsDTO } from "@/types/api";
import { multiLineTextToPath, getArcChars } from "@/lib/svg/text-utils";
import { getShapePath } from "@/lib/svg/shapes";

interface ZoomPan { scale: number; offsetX: number; offsetY: number }

interface Props {
  design: DesignState;
  settings: SettingsDTO;
  loadedFonts: Map<string, opentype.Font>;
  zoomPan: ZoomPan;
  setZoomPan: (zp: ZoomPan) => void;
  stageWidth: number;
  stageHeight: number;
  onSelectElement: (id: string | null) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onUpdateText:  (id: string, changes: Partial<TextElement>) => void;
  onUpdateShape: (id: string, changes: Partial<ShapeElement>) => void;
}

// "br" | "rm" | "tm" pentru text   (bottom-right, right-mid, top-mid)
// "br" | "rm" | "bm" pentru forme  (bottom-right, right-mid, bottom-mid)
type HandleType = "br" | "rm" | "tm" | "bm";

interface ResizeDrag {
  elementKind: "text" | "shape";
  handleType: HandleType;
  startMouseMm: { x: number; y: number };
  // text
  startSizeMm: number;
  startScaleX: number; startScaleY: number;
  startNaturalW: number; startNaturalH: number;
  startRenderedW: number; startRenderedH: number;
  startElementY: number;
  // shape
  startWidthMm: number; startHeightMm: number;
}

export default function EditorCanvas({
  design, settings, loadedFonts, zoomPan, setZoomPan,
  stageWidth, stageHeight,
  onSelectElement, onMoveElement, onUpdateText, onUpdateShape,
}: Props) {
  const { scale, offsetX, offsetY } = zoomPan;
  const pxPerMm = scale * MM_TO_PX;
  const [resizeDrag, setResizeDrag] = useState<ResizeDrag | null>(null);

  function toMm(stage: Konva.Stage) {
    const p = stage.getPointerPosition() ?? { x: 0, y: 0 };
    return { x: (p.x - offsetX) / pxPerMm, y: (p.y - offsetY) / pxPerMm };
  }

  // ─── Zoom ────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage(); if (!stage) return;
    const ptr = stage.getPointerPosition(); if (!ptr) return;
    const factor = e.evt.deltaY < 0 ? 1.1 : 1/1.1;
    const ns = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale * factor));
    const mm = { x: (ptr.x - offsetX) / (scale * MM_TO_PX), y: (ptr.y - offsetY) / (scale * MM_TO_PX) };
    setZoomPan({ scale: ns, offsetX: ptr.x - mm.x * ns * MM_TO_PX, offsetY: ptr.y - mm.y * ns * MM_TO_PX });
  }, [scale, offsetX, offsetY, setZoomPan]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || ["bg","grid"].includes(e.target.name()))
      onSelectElement(null);
  }, [onSelectElement]);

  // ─── Mouse move: resize ───────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!resizeDrag) return;
    const sel = design.elements.find(el => el.id === design.selectedId);
    if (!sel) return;
    const stage = e.target.getStage(); if (!stage) return;
    const cur = toMm(stage);
    const dx = cur.x - resizeDrag.startMouseMm.x;
    const dy = cur.y - resizeDrag.startMouseMm.y;

    if (resizeDrag.elementKind === "text") {
      switch (resizeDrag.handleType) {
        case "br": {
          const newH = resizeDrag.startRenderedH + dy;
          if (newH < 2) break;
          onUpdateText(sel.id, { sizeMm: Math.max(1, resizeDrag.startSizeMm * newH / resizeDrag.startRenderedH) });
          break;
        }
        case "rm": {
          const newW = resizeDrag.startRenderedW + dx;
          if (newW < 2) break;
          onUpdateText(sel.id, { scaleX: Math.max(0.05, newW / resizeDrag.startNaturalW) });
          break;
        }
        case "tm": {
          const newH = resizeDrag.startRenderedH - dy;
          if (newH < 2) break;
          onUpdateText(sel.id, {
            scaleY: Math.max(0.05, newH / resizeDrag.startNaturalH),
            y: resizeDrag.startElementY + dy,
          });
          break;
        }
      }
    } else {
      // shape
      switch (resizeDrag.handleType) {
        case "br": {
          const newW = resizeDrag.startWidthMm + dx;
          const newH = resizeDrag.startHeightMm + dy;
          if (newW < 2 || newH < 2) break;
          onUpdateShape(sel.id, { widthMm: Math.max(2, newW), heightMm: Math.max(2, newH) });
          break;
        }
        case "rm": {
          const newW = resizeDrag.startWidthMm + dx;
          if (newW < 2) break;
          onUpdateShape(sel.id, { widthMm: Math.max(2, newW) });
          break;
        }
        case "bm": {
          const newH = resizeDrag.startHeightMm + dy;
          if (newH < 2) break;
          onUpdateShape(sel.id, { heightMm: Math.max(2, newH) });
          break;
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeDrag, design, onUpdateText, onUpdateShape, offsetX, offsetY, pxPerMm]);

  const handleMouseUp = useCallback(() => setResizeDrag(null), []);

  // ─── Grid ─────────────────────────────────────────────────────────────────
  const gridLines: React.ReactElement[] = [];
  for (let mm = 10; mm < settings.maxWidthMm;  mm += 10)
    gridLines.push(<Line key={`gv${mm}`} points={[mm,0,mm,settings.maxHeightMm]} stroke="#e5e7eb" strokeWidth={0.1} listening={false} name="grid"/>);
  for (let mm = 10; mm < settings.maxHeightMm; mm += 10)
    gridLines.push(<Line key={`gh${mm}`} points={[0,mm,settings.maxWidthMm,mm]} stroke="#e5e7eb" strokeWidth={0.1} listening={false} name="grid"/>);

  // ─── Element selectat + handles ───────────────────────────────────────────
  const selEl  = design.elements.find(el => el.id === design.selectedId);
  const hr     = 5 / pxPerMm;
  const sw1    = 1 / pxPerMm;
  const CURSORS: Record<HandleType, string> = { br:"se-resize", rm:"e-resize", tm:"n-resize", bm:"s-resize" };

  // Calculăm dimensiunile selectie + pozițiile handle-urilor
  let selBox: { x:number; y:number; w:number; h:number } | null = null;
  let handles: Array<{ id: HandleType; x: number; y: number }> = [];

  if (selEl) {
    if (selEl.kind === "text") {
      const font = loadedFonts.get(selEl.fontId);
      if (font) {
        const useArc = Math.abs(selEl.arcDeg) > 0.5;
        const arcR = useArc ? getArcChars(selEl.text, font, selEl.sizeMm, selEl.letterSpacingMm, selEl.arcDeg) : null;
        const pi   = useArc ? null : multiLineTextToPath(selEl.text, font, selEl.sizeMm, selEl.letterSpacingMm, selEl.align);
        const natW = arcR?.totalWidth  ?? pi?.totalWidth  ?? 0;
        const natH = arcR?.totalHeight ?? pi?.totalHeight ?? 0;
        if (natW > 0) {
          const rw = natW * (selEl.scaleX ?? 1);
          const rh = natH * (selEl.scaleY ?? 1);
          selBox = { x: selEl.x, y: selEl.y, w: rw, h: rh };
          handles = [
            { id:"br", x: selEl.x+rw,   y: selEl.y+rh   },
            { id:"rm", x: selEl.x+rw,   y: selEl.y+rh/2 },
            { id:"tm", x: selEl.x+rw/2, y: selEl.y      },
          ];
        }
      }
    } else if (selEl.kind === "shape") {
      const { x, y, widthMm: w, heightMm: h } = selEl;
      selBox = { x, y, w, h };
      handles = [
        { id:"br", x: x+w,   y: y+h   },
        { id:"rm", x: x+w,   y: y+h/2 },
        { id:"bm", x: x+w/2, y: y+h   },
      ];
    }
  }

  function startResize(hid: HandleType, stageSrc: Konva.Stage) {
    if (!selEl) return;
    const mm = toMm(stageSrc);
    if (selEl.kind === "text") {
      const font = loadedFonts.get(selEl.fontId);
      const useArc = Math.abs(selEl.arcDeg) > 0.5;
      const arcR = useArc && font ? getArcChars(selEl.text, font, selEl.sizeMm, selEl.letterSpacingMm, selEl.arcDeg) : null;
      const pi   = (!useArc && font) ? multiLineTextToPath(selEl.text, font, selEl.sizeMm, selEl.letterSpacingMm, selEl.align) : null;
      const nw = arcR?.totalWidth  ?? pi?.totalWidth  ?? 0;
      const nh = arcR?.totalHeight ?? pi?.totalHeight ?? 0;
      setResizeDrag({
        elementKind: "text", handleType: hid, startMouseMm: mm,
        startSizeMm: selEl.sizeMm, startScaleX: selEl.scaleX??1, startScaleY: selEl.scaleY??1,
        startNaturalW: nw, startNaturalH: nh,
        startRenderedW: nw*(selEl.scaleX??1), startRenderedH: nh*(selEl.scaleY??1),
        startElementY: selEl.y,
        startWidthMm: 0, startHeightMm: 0,
      });
    } else if (selEl.kind === "shape") {
      setResizeDrag({
        elementKind: "shape", handleType: hid, startMouseMm: mm,
        startSizeMm:0, startScaleX:1, startScaleY:1,
        startNaturalW:0, startNaturalH:0, startRenderedW:0, startRenderedH:0, startElementY:0,
        startWidthMm: selEl.widthMm, startHeightMm: selEl.heightMm,
      });
    }
  }

  return (
    <Stage width={stageWidth} height={stageHeight}
      onWheel={handleWheel} onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
      style={{ cursor: resizeDrag ? CURSORS[resizeDrag.handleType] : "default" }}
    >
      <Layer listening={false}>
        <Rect width={stageWidth} height={stageHeight} fill="#d1d5db"/>
      </Layer>

      <Layer>
        <Group x={offsetX} y={offsetY} scaleX={pxPerMm} scaleY={pxPerMm}>

          {/* Design area */}
          <Rect x={0.5} y={0.5} width={settings.maxWidthMm} height={settings.maxHeightMm} fill="#00000018" listening={false}/>
          <Rect x={0} y={0} width={settings.maxWidthMm} height={settings.maxHeightMm} fill="white" name="bg"/>
          {gridLines}
          <Rect x={0} y={0} width={settings.maxWidthMm} height={settings.maxHeightMm} fill="transparent" stroke="#9ca3af" strokeWidth={0.2} listening={false}/>

          {/* ── Elemente ── */}
          {design.elements.map((el) => {
            const isSelected = el.id === design.selectedId;

            if (el.kind === "text") {
              const font = loadedFonts.get(el.fontId);
              if (!font) return (
                <Rect key={el.id} x={el.x} y={el.y}
                  width={el.sizeMm*el.text.length*0.6} height={el.sizeMm}
                  fill="#f3e8ff" stroke="#a855f7" strokeWidth={0.3}
                  onClick={() => onSelectElement(el.id)}/>
              );
              // Arc sau text drept
              const useArc = Math.abs(el.arcDeg) > 0.5;
              const arcResult = useArc
                ? getArcChars(el.text, font, el.sizeMm, el.letterSpacingMm, el.arcDeg)
                : null;
              const pi = useArc ? null
                : multiLineTextToPath(el.text, font, el.sizeMm, el.letterSpacingMm, el.align);
              if (!arcResult && !pi) return null;

              const rw = (arcResult?.totalWidth  ?? pi!.totalWidth)  * (el.scaleX??1);
              const rh = (arcResult?.totalHeight ?? pi!.totalHeight) * (el.scaleY??1);
              const outOfBounds = el.x < 0 || el.y < 0
                || el.x + rw > settings.maxWidthMm
                || el.y + rh > settings.maxHeightMm;
              const fillColor = outOfBounds ? "#ef4444" : "#1f2937";

              return (
                <Group key={el.id} x={el.x} y={el.y}
                  scaleX={el.scaleX??1} scaleY={el.scaleY??1}
                  draggable
                  onClick={() => onSelectElement(el.id)}
                  onDragEnd={(e) => onMoveElement(el.id, e.target.x(), e.target.y())}
                  onMouseEnter={(e) => { const s=e.target.getStage(); if(s&&!resizeDrag) s.container().style.cursor="move"; }}
                  onMouseLeave={(e) => { const s=e.target.getStage(); if(s&&!resizeDrag) s.container().style.cursor="default"; }}
                >
                  {arcResult
                    ? arcResult.chars.map((c, i) => (
                        <Group key={i} x={c.x} y={c.y} rotation={c.rotDeg}>
                          <Path data={c.pathD} fill={fillColor}/>
                        </Group>
                      ))
                    : <Path data={pi!.d} fill={fillColor}/>
                  }
                  {outOfBounds && (
                    <Rect x={0} y={0} width={rw/(el.scaleX??1)} height={rh/(el.scaleY??1)}
                      fill="transparent" stroke="#ef4444" strokeWidth={0.5/((el.scaleX??1))}
                      dash={[2/((el.scaleX??1)), 1/((el.scaleX??1))]} listening={false}/>
                  )}
                </Group>
              );
            }

            if (el.kind === "shape") {
              const d = getShapePath(el.slug, el.widthMm, el.heightMm);
              if (!d) return null;
              const outOfBounds = el.x < 0 || el.y < 0
                || el.x + el.widthMm > settings.maxWidthMm
                || el.y + el.heightMm > settings.maxHeightMm;
              return (
                <Group key={el.id} x={el.x} y={el.y}
                  draggable
                  onClick={() => onSelectElement(el.id)}
                  onDragEnd={(e) => onMoveElement(el.id, e.target.x(), e.target.y())}
                  onMouseEnter={(e) => { const s=e.target.getStage(); if(s&&!resizeDrag) s.container().style.cursor="move"; }}
                  onMouseLeave={(e) => { const s=e.target.getStage(); if(s&&!resizeDrag) s.container().style.cursor="default"; }}
                >
                  <Path
                    data={d}
                    fill={isSelected ? "#e0e7ff" : "#f1f5f9"}
                    stroke={outOfBounds ? "#ef4444" : "#1f2937"}
                    strokeWidth={outOfBounds ? 0.6 : 0.3}
                  />
                </Group>
              );
            }

            return null;
          })}

          {/* ── Selection box + handles ── */}
          {selBox && (
            <>
              <Rect x={selBox.x} y={selBox.y} width={selBox.w} height={selBox.h}
                fill="transparent" stroke="#6366f1" strokeWidth={sw1}
                dash={[3*sw1,2*sw1]} listening={false}/>
              {handles.map((h) => (
                <Circle key={h.id} x={h.x} y={h.y} radius={hr}
                  fill="white" stroke="#6366f1" strokeWidth={1.5*sw1}
                  onMouseDown={(e) => {
                    e.cancelBubble = true;
                    startResize(h.id, e.target.getStage()!);
                  }}
                  onMouseEnter={(e) => { e.target.getStage()!.container().style.cursor = CURSORS[h.id]; }}
                  onMouseLeave={(e) => { if (!resizeDrag) e.target.getStage()!.container().style.cursor="default"; }}
                />
              ))}
            </>
          )}
        </Group>
      </Layer>
    </Stage>
  );
}
