// Utilitar comun pentru randarea textului cu opentype.js.
// Suportă text multi-linie (drept) și text pe arc.

import type opentype from "opentype.js";

const LINE_HEIGHT_RATIO = 1.35;

// ─── Arc text ─────────────────────────────────────────────────────────────────

export interface ArcCharResult {
  pathD: string;   // path al unui singur caracter, cu bbox top-left la (0,0)
  x: number;       // poziție baseline pe arc (în mm)
  y: number;
  rotDeg: number;  // rotație în grade (pozitiv = clockwise)
  charW: number;   // lățimea avansului
  charH: number;   // înălțimea aprox. a caracterului
}

export interface ArcTextResult {
  chars: ArcCharResult[];
  totalWidth: number;
  totalHeight: number;
}

/**
 * Returnează pozițiile individuale ale caracterelor pentru text pe arc.
 * arcDeg > 0: arc convex (rainbow ↑), arcDeg < 0: arc concav (frownward ↓).
 * Toate coordonatele sunt în mm, cu top-left al bounding box la (0, 0).
 */
export function getArcChars(
  text: string,
  font: opentype.Font,
  sizeMm: number,
  letterSpacingMm: number,
  arcDeg: number
): ArcTextResult | null {
  const line = text.split("\n")[0]; // arc funcționează pe o singură linie
  if (!line.trim()) return null;

  const opts = { letterSpacing: sizeMm > 0 ? letterSpacingMm / sizeMm : 0, kerning: true };
  const ascender  = (font.ascender  / font.unitsPerEm) * sizeMm;
  const descender = Math.abs(font.descender / font.unitsPerEm) * sizeMm;
  const charH = ascender + descender;

  // Colectăm glyph-urile.
  // IMPORTANT: path-ul are BASELINE la y=0 (nu bbox-top la 0).
  // Literele se extind DEASUPRA baseline (y negativ = ascenderi) și
  // puțin dedesubt (y pozitiv = descenderi). Rotația se face în jurul
  // punctului (0,0) = baseline-stânga — exact punctul care „stă" pe arc.
  const glyphs: Array<{ pathD: string; adv: number }> = [];
  let totalWidth = 0;

  for (const char of line) {
    const glyph = font.charToGlyph(char);
    const adv   = (glyph.advanceWidth ?? 0) / font.unitsPerEm * sizeMm + letterSpacingMm;
    const tp    = font.getPath(char, 0, 0, sizeMm, opts);
    const bb    = tp.getBoundingBox();
    // Eliminăm doar side-bearing-ul stâng; y=0 rămâne baseline
    const pathD = font.getPath(char, -(bb.x1 ?? 0), 0, sizeMm, opts).toPathData(3);
    glyphs.push({ pathD, adv });
    totalWidth += adv;
  }

  if (totalWidth === 0) return null;

  const α   = Math.abs(arcDeg) * Math.PI / 180;
  const dir = arcDeg >= 0 ? 1 : -1; // 1 = rainbow ↑,  -1 = frown ↓

  // Text drept (arcDeg ≈ 0) — baseline la y=ascender față de top
  if (α < 0.02) {
    let x = 0;
    const chars = glyphs.map(g => {
      // y = ascender: baseline se află la ascender distanță de la top-ul bbox
      const c: ArcCharResult = { pathD: g.pathD, x, y: ascender, rotDeg: 0, charW: g.adv, charH };
      x += g.adv;
      return c;
    });
    return { chars, totalWidth, totalHeight: charH };
  }

  // Raza cercului: chord formula — arcDeg determină CURBURA, nu span-ul textului
  const R = totalWidth / (2 * Math.sin(α / 2));

  // Unghiul total acoperit de text (arc-length = totalWidth → span = totalWidth/R)
  // Textul se centrează pe arc: de la -span/2 la +span/2
  const textSpan     = totalWidth / R;          // radiani ocupați efectiv de text
  const halfTextSpan = textSpan / 2;

  let currentAngle = -halfTextSpan;             // stânga primului caracter, centrat
  const rawChars: ArcCharResult[] = [];

  for (const g of glyphs) {
    const da  = g.adv / R;          // unghiul subtins de advance-ul caracterului
    const θ   = currentAngle;       // unghi la STÂNGA caracterului (pivot)

    // Poziția baseline-stânga pe cerc cu centrul la (0, R) [sus] sau (0, -R) [jos]
    const rawX   = R * Math.sin(θ);
    const rawY   = dir * R * (1 - Math.cos(θ));
    const rotDeg = dir * θ * (180 / Math.PI);

    rawChars.push({ pathD: g.pathD, x: rawX, y: rawY, rotDeg, charW: g.adv, charH });
    currentAngle += da;
  }

  // Bounding box bazată pe span-ul real al textului (nu pe α)
  const arcHeight = R * (1 - Math.cos(halfTextSpan)); // săgeata reală a arcului de text
  const halfChord = R * Math.sin(halfTextSpan);        // jumătate din coarda reală
  // Padding lateral pentru literele de la capete (rotite cu ±halfTextSpan)
  const sidepad   = charH * Math.abs(Math.sin(halfTextSpan)) * 0.6;

  let minX: number, maxX: number, minY: number, maxY: number;
  if (dir > 0) {
    // Rainbow ↑: centrul arcului SUS (y=0 = top), capetele JOS
    // Baseline-ul literelor din centru este la y=0 pe arc
    // Ascenderii literelor din centru urcă la y = -ascender (deasupra arcului)
    minX = -(halfChord + sidepad);
    maxX =   halfChord + sidepad;
    minY = -ascender;                 // topul literelor din centru (sus)
    maxY = arcHeight + descender;     // fundul literelor de la capete (jos)
  } else {
    // Frown ↓: centrul arcului JOS (y=0 = bottom baseline), capetele SUS
    minX = -(halfChord + sidepad);
    maxX =   halfChord + sidepad;
    minY = -arcHeight - ascender;     // topul literelor de la capete (sus)
    maxY = descender;                 // fundul literelor din centru (jos)
  }

  // Normalizăm: top-left bbox → (0,0)
  const chars = rawChars.map(c => ({
    ...c,
    x: c.x - minX,
    y: c.y - minY,
  }));

  return {
    chars,
    totalWidth:  maxX - minX,
    totalHeight: maxY - minY,
  };
}

export interface MultiLinePathResult {
  d: string;           // SVG path data combinat (toate liniile)
  totalWidth: number;  // lățimea totală în mm (linia cea mai lată)
  totalHeight: number; // înălțimea totală în mm
}

/**
 * Generează SVG path data pentru text multi-linie.
 * Colțul top-left al rezultatului este întotdeauna la (0, 0).
 * Apelantul plasează rezultatul la (el.x, el.y) via transform sau x/y Konva.
 */
export function multiLineTextToPath(
  text: string,
  font: opentype.Font,
  sizeMm: number,
  letterSpacingMm: number,
  align: "left" | "center" | "right" = "left"
): MultiLinePathResult | null {
  const lines = text.split("\n");
  const opts = {
    letterSpacing: sizeMm > 0 ? letterSpacingMm / sizeMm : 0,
    kerning: true,
  };
  const lineHeightMm = sizeMm * LINE_HEIGHT_RATIO;

  // Pasul 1: calculăm bbox pentru fiecare linie (la baseline y=0)
  interface LineInfo {
    text: string;
    width: number;
    x1: number; // side bearing stâng
    y1: number; // distanța de la baseline la capul literelor (negativ)
  }

  const lineInfos: (LineInfo | null)[] = lines.map((line) => {
    if (!line.trim()) return null; // linie goală

    const tp = font.getPath(line, 0, 0, sizeMm, opts);
    const bb = tp.getBoundingBox();
    if (bb.x1 >= bb.x2) return null; // glyph invizibil

    return {
      text: line,
      width: bb.x2 - bb.x1,
      x1: bb.x1,
      y1: bb.y1, // negativ: litera e deasupra baseline-ului
    };
  });

  const maxWidth = Math.max(
    0,
    ...lineInfos.map((l) => (l ? l.width : 0))
  );

  if (maxWidth === 0) return null;

  // Pasul 2: generăm path-urile cu offset-urile corecte
  const parts: string[] = [];
  let currentY = 0; // y-ul top-left al rândului curent

  for (let i = 0; i < lines.length; i++) {
    const info = lineInfos[i];

    if (!info) {
      // Linie goală — avansăm Y cu un rând
      currentY += lineHeightMm;
      continue;
    }

    // X în funcție de aliniere
    let lineStartX: number;
    switch (align) {
      case "center":
        lineStartX = (maxWidth - info.width) / 2 - info.x1;
        break;
      case "right":
        lineStartX = maxWidth - info.width - info.x1;
        break;
      default: // "left"
        lineStartX = -info.x1;
    }

    // Baseline Y: vrem ca top-ul literelor să fie la currentY
    // info.y1 < 0 înseamnă că litera e deasupra baseline-ului
    const baselineY = currentY - info.y1;

    const path = font.getPath(info.text, lineStartX, baselineY, sizeMm, opts);
    parts.push(path.toPathData(3));

    currentY += lineHeightMm;
  }

  if (parts.length === 0) return null;

  // Înălțimea totală: cât am avansat Y minus spațiul extra după ultima linie
  const totalHeight = Math.max(currentY - (lineHeightMm - sizeMm), sizeMm);

  return {
    d: parts.join(" "),
    totalWidth: maxWidth,
    totalHeight,
  };
}
