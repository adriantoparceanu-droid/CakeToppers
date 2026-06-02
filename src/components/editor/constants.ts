// Conversion: 1 inch = 25.4mm, la 96 DPI → 96/25.4 px/mm
export const MM_TO_PX = 3.7795275591

export const RULER_SIZE = 24      // grosimea riglei în px
export const MIN_ZOOM   = 0.1
export const MAX_ZOOM   = 8
export const ZOOM_STEP  = 0.1     // pentru butoanele +/-

// Intervalele de ticks ale riglei (în mm), alese astfel încât major ticks să fie ~60-120px
export function getRulerIntervals(pxPerMm: number): { minor: number; major: number } {
  // Dorim major tick la ~80px
  const candidates: Array<[number, number]> = [
    [0.5, 2.5],
    [1,   5],
    [2,   10],
    [5,   25],
    [10,  50],
    [20,  100],
    [50,  250],
    [100, 500],
  ]
  for (const [minor, major] of candidates) {
    if (major * pxPerMm >= 60) return { minor, major }
  }
  return { minor: 100, major: 500 }
}
