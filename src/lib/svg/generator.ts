// Generatorul SVG laser-ready.
// Reguli stricte pentru LightBurn:
//   • 1 user unit = 1 mm (width/height în mm, viewBox în mm)
//   • Text convertit în path-uri via opentype.js (zero elemente <text>)
//   • Culoare cut = #FF0000, fill=none, stroke subțire
//   • Coordonate normalizate: originea SVG = colțul top-left al conținutului

import type opentype from "opentype.js";
import type { DesignState, TextElement } from "@/types/design";
import type { SettingsDTO } from "@/types/api";
import { multiLineTextToPath, getArcChars } from "./text-utils";
import { getShapePath } from "./shapes";

export interface FontMap {
  [fontId: string]: opentype.Font;
}

interface ElementResult {
  d: string;          // pentru text drept: path data; pentru arc: markup SVG complet cu <g>
  isArcMarkup: boolean;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  x1: number; y1: number; x2: number; y2: number;
}

function textToPathResult(el: TextElement, font: opentype.Font): ElementResult | null {
  if (!el.text.trim()) return null;

  const sx = el.scaleX ?? 1;
  const sy = el.scaleY ?? 1;
  const useArc = Math.abs(el.arcDeg) > 0.5;

  if (useArc) {
    const arcResult = getArcChars(el.text, font, el.sizeMm, el.letterSpacingMm, el.arcDeg);
    if (!arcResult) return null;

    // Combina path-urile cu transform per caracter
    const combinedParts = arcResult.chars.map(c => {
      const rad = c.rotDeg * Math.PI / 180;
      const cos = +Math.cos(rad).toFixed(6);
      const sin = +Math.sin(rad).toFixed(6);
      return `<g transform="matrix(${cos},${sin},${-sin},${cos},${+c.x.toFixed(3)},${+c.y.toFixed(3)})">`
           + `<path d="${c.pathD}"/></g>`;
    });
    const d = combinedParts.join("");

    return {
      d, isArcMarkup: true,
      offsetX: el.x, offsetY: el.y,
      scaleX: sx, scaleY: sy,
      x1: el.x, y1: el.y,
      x2: el.x + arcResult.totalWidth  * sx,
      y2: el.y + arcResult.totalHeight * sy,
    };
  }

  const result = multiLineTextToPath(el.text, font, el.sizeMm, el.letterSpacingMm, el.align);
  if (!result) return null;

  return {
    d: result.d, isArcMarkup: false,
    offsetX: el.x, offsetY: el.y,
    scaleX: sx, scaleY: sy,
    x1: el.x, y1: el.y,
    x2: el.x + result.totalWidth  * sx,
    y2: el.y + result.totalHeight * sy,
  };
}

export interface SVGResult {
  svg: string;
  widthMm: number;
  heightMm: number;
  warnings: string[];
}

export function generateSVG(
  design: DesignState,
  fontMap: FontMap,
  settings: SettingsDTO,
  clientName = "client"
): SVGResult {
  const warnings: string[] = [];
  const results: ElementResult[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const el of design.elements) {
    if (el.kind === "text") {
      if (!el.text.trim()) { warnings.push("Element text gol omis."); continue; }
      const font = fontMap[el.fontId];
      if (!font) { warnings.push(`Font necărcat: "${el.text}".`); continue; }
      const result = textToPathResult(el, font);
      if (!result) continue;
      results.push(result);
      minX = Math.min(minX, result.x1); minY = Math.min(minY, result.y1);
      maxX = Math.max(maxX, result.x2); maxY = Math.max(maxY, result.y2);
    }

    if (el.kind === "shape") {
      const d = getShapePath(el.slug, el.widthMm, el.heightMm);
      if (!d) continue;
      const r: ElementResult = {
        d, isArcMarkup: false, offsetX: el.x, offsetY: el.y, scaleX: 1, scaleY: 1,
        x1: el.x, y1: el.y, x2: el.x + el.widthMm, y2: el.y + el.heightMm,
      };
      results.push(r);
      minX = Math.min(minX, r.x1); minY = Math.min(minY, r.y1);
      maxX = Math.max(maxX, r.x2); maxY = Math.max(maxY, r.y2);
    }
  }

  if (results.length === 0) {
    warnings.push("Niciun element valid de exportat.");
    return { svg: "", widthMm: 0, heightMm: 0, warnings };
  }

  const w = +(maxX - minX).toFixed(3);
  const h = +(maxY - minY).toFixed(3);
  const sw = settings.cutStrokeWidthMm;

  // Fiecare element are path-ul la (0,0) și un transform care îl mută la
  // poziția corectă, normalizată față de (minX, minY)
  const svgElements = results.map((r) => {
    const tx = +(r.offsetX - minX).toFixed(3);
    const ty = +(r.offsetY - minY).toFixed(3);
    // scaleY aplicat față de originea elementului (top-left = ancora)
    const hasScale = r.scaleX !== 1 || r.scaleY !== 1;
    const transform = hasScale
      ? `translate(${tx},${ty}) scale(${r.scaleX.toFixed(6)},${r.scaleY.toFixed(6)})`
      : `translate(${tx},${ty})`;
    if (r.isArcMarkup) {
      // Arc text: d conține deja markup-ul <g> per caracter
      return `  <g transform="${transform}" fill="none" stroke="#FF0000" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${r.d}</g>`;
    }
    return `  <g transform="${transform}">` +
      `<path d="${r.d}" fill="none" stroke="#FF0000" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</g>`;
  });

  const safeClient = clientName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 20);
  const textSample = design.elements
    .filter((e) => e.kind === "text")
    .map((e) => (e as TextElement).text.replace(/\n/g, "-").slice(0, 10))
    .join("-")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- CakeTopper Studio — 1 unit = 1mm -->
<!-- Layer Cut: #FF0000 | Dimensiune: ${w}mm × ${h}mm -->
<!-- Fișier: ${safeClient}_${textSample}_${w}x${h}mm.svg -->
<svg xmlns="http://www.w3.org/2000/svg"
     width="${w}mm" height="${h}mm"
     viewBox="0 0 ${w} ${h}">
  <!-- Cut layer (roșu = tăiere în LightBurn) -->
${svgElements.join("\n")}
</svg>`;

  return { svg, widthMm: w, heightMm: h, warnings };
}

// Calculează bounding box-ul design-ului pentru afișarea dimensiunilor în editor
export function getDesignBounds(
  design: DesignState,
  fontMap: FontMap
): { widthMm: number; heightMm: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasContent = false;

  for (const el of design.elements) {
    if (el.kind === "text") {
      const font = fontMap[el.fontId];
      if (!font || !el.text.trim()) continue;
      const result = textToPathResult(el, font);
      if (!result) continue;
      minX = Math.min(minX, result.x1);
      minY = Math.min(minY, result.y1);
      maxX = Math.max(maxX, result.x2);
      maxY = Math.max(maxY, result.y2);
      hasContent = true;
    }
  }

  if (!hasContent) return { widthMm: 0, heightMm: 0 };
  return {
    widthMm: +((maxX - minX).toFixed(1)),
    heightMm: +((maxY - minY).toFixed(1)),
  };
}
