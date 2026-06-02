// Tipuri pentru starea designului — shared între editor, API și generator SVG

export type Unit = "mm" | "cm";

export interface TextElement {
  kind: "text";
  id: string;
  text: string;
  fontId: string;
  sizeMm: number;
  letterSpacingMm: number;
  scaleX: number;           // 1 = normal; modificat de handle-ul dreapta-mijloc
  scaleY: number;           // 1 = normal; modificat de handle-ul sus-mijloc
  arcDeg: number;           // 0 = drept, >0 = arc convex, <0 = arc concav
  x: number;                // mm față de originea canvasului
  y: number;
  rotation: number;         // grade
  align: "left" | "center" | "right";
}

export interface ShapeElement {
  kind: "shape";
  id: string;
  slug: string;             // "heart" | "circle" | "star"
  widthMm: number;
  heightMm: number;
  x: number;
  y: number;
  rotation: number;
}

export interface StickElement {
  kind: "stick";
  id: string;
  widthMm: number;
  heightMm: number;
  x: number;
  y: number;
}

export type DesignElement = TextElement | ShapeElement | StickElement;

export interface DesignState {
  unit: Unit;
  elements: DesignElement[];
  selectedId: string | null;
}

// Dimensiunile efective ale designului (bounding box al tuturor elementelor)
export interface DesignBounds {
  widthMm: number;
  heightMm: number;
}
