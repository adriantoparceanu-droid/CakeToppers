"use client";

import { RULER_SIZE, MM_TO_PX, getRulerIntervals } from "./constants";
import type { Unit } from "@/types/design";

interface Props {
  width: number;
  offsetX: number;   // pan offset în px (stage space)
  scale: number;     // zoom factor
  unit: Unit;
}

export function RulerH({ width, offsetX, scale, unit }: Props) {
  const pxPerMm = scale * MM_TO_PX;
  const { minor, major } = getRulerIntervals(pxPerMm);

  const ticks: Array<{ pos: number; label?: string; height: number }> = [];

  const startMm = Math.floor(-offsetX / pxPerMm / minor) * minor - minor;
  const endMm = Math.ceil((width - offsetX) / pxPerMm / minor) * minor + minor;

  for (let mm = startMm; mm <= endMm; mm += minor) {
    const x = Math.round(offsetX + mm * pxPerMm);
    if (x < 0 || x > width) continue;

    // Floating-point comparison: is this a major tick?
    const isMajor = Math.abs(Math.round(mm / major) * major - mm) < 0.001;
    const label = isMajor
      ? unit === "cm"
        ? String(+(mm / 10).toFixed(1)).replace(/\.0$/, "")
        : String(mm)
      : undefined;

    ticks.push({ pos: x, label, height: isMajor ? 12 : 6 });
  }

  // Zero marker (origin line)
  const zeroX = Math.round(offsetX);

  return (
    <svg
      width={width}
      height={RULER_SIZE}
      style={{ display: "block", userSelect: "none" }}
    >
      <rect width={width} height={RULER_SIZE} fill="#f8f9fa" />
      {ticks.map((t, i) => (
        <g key={i} transform={`translate(${t.pos},0)`}>
          <line
            x1={0} y1={RULER_SIZE}
            x2={0} y2={RULER_SIZE - t.height}
            stroke="#9ca3af"
            strokeWidth={0.5}
          />
          {t.label && (
            <text
              x={2} y={RULER_SIZE - t.height - 1}
              fontSize={8}
              fill="#6b7280"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {t.label}
            </text>
          )}
        </g>
      ))}
      {/* Linia de jos a riglei */}
      <line x1={0} y1={RULER_SIZE - 0.5} x2={width} y2={RULER_SIZE - 0.5} stroke="#e5e7eb" strokeWidth={1} />
      {/* Marker pentru originea designului */}
      {zeroX >= 0 && zeroX <= width && (
        <line x1={zeroX} y1={0} x2={zeroX} y2={RULER_SIZE} stroke="#6366f1" strokeWidth={1} opacity={0.6} />
      )}
    </svg>
  );
}
