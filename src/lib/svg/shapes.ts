// Path-uri SVG parametrice pentru forme — toate în coordonate locale (0,0) → (w,h)
// Folosite atât în editorul canvas cât și în exportul SVG laser.

function f(n: number) { return +n.toFixed(3); }

function heartPath(w: number, h: number): string {
  const p = (x: number, y: number) => `${f(x*w/100)} ${f(y*h/100)}`;
  return (
    `M ${p(50,28)} ` +
    `C ${p(50,10)},${p(82,8)},${p(82,30)} ` +
    `C ${p(82,55)},${p(56,72)},${p(50,92)} ` +
    `C ${p(44,72)},${p(18,55)},${p(18,30)} ` +
    `C ${p(18,8)},${p(50,10)},${p(50,28)} Z`
  );
}

function circlePath(w: number, h: number): string {
  const k = 0.5523;
  const rx = w/2, ry = h/2, cx = w/2, cy = h/2;
  return (
    `M ${f(cx)} ${f(cy-ry)} ` +
    `C ${f(cx+rx*k)} ${f(cy-ry)},${f(cx+rx)} ${f(cy-ry*k)},${f(cx+rx)} ${f(cy)} ` +
    `C ${f(cx+rx)} ${f(cy+ry*k)},${f(cx+rx*k)} ${f(cy+ry)},${f(cx)} ${f(cy+ry)} ` +
    `C ${f(cx-rx*k)} ${f(cy+ry)},${f(cx-rx)} ${f(cy+ry*k)},${f(cx-rx)} ${f(cy)} ` +
    `C ${f(cx-rx)} ${f(cy-ry*k)},${f(cx-rx*k)} ${f(cy-ry)},${f(cx)} ${f(cy-ry)} Z`
  );
}

function starPath(w: number, h: number, points = 5): string {
  const cx = w/2, cy = h/2;
  const outerR = Math.min(w,h)/2 * 0.97;
  const innerR = outerR * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < points*2; i++) {
    const angle = (i * Math.PI / points) - Math.PI/2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${f(cx + r*Math.cos(angle))} ${f(cy + r*Math.sin(angle))}`);
  }
  return `M ${pts.join(' L ')} Z`;
}

function stickPath(w: number, h: number): string {
  const r = f(Math.min(w*0.4, 5)); // colțuri rotunjite în jos
  const hw = f(w/2);
  return (
    `M 0 0 L ${f(w)} 0 ` +
    `L ${f(w)} ${f(h-+r)} ` +
    `Q ${f(w)} ${f(h)} ${hw} ${f(h)} ` +
    `Q 0 ${f(h)} 0 ${f(h-+r)} Z`
  );
}

export function getShapePath(slug: string, w: number, h: number): string | null {
  if (w <= 0 || h <= 0) return null;
  switch (slug) {
    case "heart":  return heartPath(w, h);
    case "circle": return circlePath(w, h);
    case "star":   return starPath(w, h);
    case "stick":  return stickPath(w, h);
    default:       return null;
  }
}

export const SHAPE_DEFAULTS: Record<string, { widthMm: number; heightMm: number }> = {
  heart:  { widthMm: 60, heightMm: 55 },
  circle: { widthMm: 60, heightMm: 60 },
  star:   { widthMm: 60, heightMm: 60 },
  stick:  { widthMm: 12, heightMm: 70 },
};
