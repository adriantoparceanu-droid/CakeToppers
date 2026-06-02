"use client";

import { RULER_SIZE, MM_TO_PX, getRulerIntervals } from "./constants";
import type { Unit } from "@/types/design";

interface Props {
  height: number;
  offsetY: number;
  scale: number;
  unit: Unit;
}

export function RulerV({ height, offsetY, scale, unit }: Props) {
  const pxPerMm = scale * MM_TO_PX;
  const { minor, major } = getRulerIntervals(pxPerMm);

  const ticks: Array<{ pos: number; label?: string; width: number }> = [];

  const startMm = Math.floor(-offsetY / pxPerMm / minor) * minor - minor;
  const endMm = Math.ceil((height - offsetY) / pxPerMm / minor) * minor + minor;

  for (let mm = startMm; mm <= endMm; mm += minor) {
    const y = Math.round(offsetY + mm * pxPerMm);
    if (y < 0 || y > height) continue;

    const isMajor = Math.abs(Math.round(mm / major) * major - mm) < 0.001;
    const label = isMajor
      ? unit === "cm"
        ? String(+(mm / 10).toFixed(1)).replace(/\.0$/, "")
        : String(mm)
      : undefined;

    ticks.push({ pos: y, label, width: isMajor ? 12 : 6 });
  }

  const zeroY = Math.round(offsetY);

  return (
    <svg
      width={RULER_SIZE}
      height={height}
      style={{ display: "block", userSelect: "none" }}
    >
      <rect width={RULER_SIZE} height={height} fill="#f8f9fa" />
      {ticks.map((t, i) => (
        <g key={i} transform={`translate(0,${t.pos})`}>
          <line
            x1={RULER_SIZE} y1={0}
            x2={RULER_SIZE - t.width} y2={0}
            stroke="#9ca3af"
            strokeWidth={0.5}
          />
          {t.label && (
            <text
              x={RULER_SIZE - t.width - 2}
              y={-2}
              fontSize={8}
              fill="#6b7280"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              transform={`rotate(-90, ${RULER_SIZE - t.width - 2}, -2)`}
            >
              {t.label}
            </text>
          )}
        </g>
      ))}
      <line x1={RULER_SIZE - 0.5} y1={0} x2={RULER_SIZE - 0.5} y2={height} stroke="#e5e7eb" strokeWidth={1} />
      {zeroY >= 0 && zeroY <= height && (
        <line x1={0} y1={zeroY} x2={RULER_SIZE} y2={zeroY} stroke="#6366f1" strokeWidth={1} opacity={0.6} />
      )}
    </svg>
  );
}
