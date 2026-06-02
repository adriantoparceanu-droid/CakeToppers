"use client";

import { useReducer, useCallback } from "react";
import type { DesignState, DesignElement, TextElement, ShapeElement, Unit } from "@/types/design";
import { SHAPE_DEFAULTS } from "@/lib/svg/shapes";

const DEFAULT_FONT_SIZE_MM = 20;

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const initialState: DesignState = {
  unit: "mm",
  elements: [],
  selectedId: null,
};

type LayerOp = "front" | "forward" | "backward" | "back";

type Action =
  | { type: "ADD_TEXT";  fontId: string; fontName: string }
  | { type: "ADD_SHAPE"; slug: string }
  | { type: "UPDATE_TEXT";  id: string; changes: Partial<TextElement> }
  | { type: "UPDATE_SHAPE"; id: string; changes: Partial<ShapeElement> }
  | { type: "MOVE_ELEMENT"; id: string; x: number; y: number }
  | { type: "REORDER"; id: string; op: LayerOp }
  | { type: "SELECT"; id: string | null }
  | { type: "DELETE"; id: string }
  | { type: "SET_UNIT"; unit: Unit };

function reducer(state: DesignState, action: Action): DesignState {
  switch (action.type) {
    case "ADD_TEXT": {
      const el: TextElement = {
        kind: "text", id: makeId(),
        text: "Text", fontId: action.fontId,
        sizeMm: DEFAULT_FONT_SIZE_MM, letterSpacingMm: 0,
        scaleX: 1, scaleY: 1, arcDeg: 0,
        x: 10, y: 10, rotation: 0, align: "center",
      };
      return { ...state, elements: [...state.elements, el], selectedId: el.id };
    }

    case "ADD_SHAPE": {
      const def = SHAPE_DEFAULTS[action.slug] ?? { widthMm: 50, heightMm: 50 };
      const el: ShapeElement = {
        kind: "shape", id: makeId(), slug: action.slug,
        widthMm: def.widthMm, heightMm: def.heightMm,
        x: 20, y: 20, rotation: 0,
      };
      return { ...state, elements: [...state.elements, el], selectedId: el.id };
    }

    case "UPDATE_TEXT": {
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id && el.kind === "text" ? { ...el, ...action.changes } : el
        ),
      };
    }

    case "UPDATE_SHAPE": {
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id && el.kind === "shape" ? { ...el, ...action.changes } : el
        ),
      };
    }

    case "MOVE_ELEMENT":
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.id ? { ...el, x: action.x, y: action.y } : el
        ),
      };

    case "REORDER": {
      const els = [...state.elements];
      const idx = els.findIndex((e) => e.id === action.id);
      if (idx === -1) return state;
      const [el] = els.splice(idx, 1);
      switch (action.op) {
        case "front":   els.push(el); break;
        case "forward": els.splice(Math.min(idx + 1, els.length), 0, el); break;
        case "backward":els.splice(Math.max(idx - 1, 0), 0, el); break;
        case "back":    els.unshift(el); break;
      }
      return { ...state, elements: els };
    }

    case "SELECT":
      return { ...state, selectedId: action.id };

    case "DELETE":
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };

    case "SET_UNIT":
      return { ...state, unit: action.unit };

    default:
      return state;
  }
}

export function useDesign() {
  const [design, dispatch] = useReducer(reducer, initialState);

  const addText  = useCallback((fontId: string, fontName: string) =>
    dispatch({ type: "ADD_TEXT", fontId, fontName }), []);

  const addShape = useCallback((slug: string) =>
    dispatch({ type: "ADD_SHAPE", slug }), []);

  const updateText  = useCallback((id: string, changes: Partial<TextElement>) =>
    dispatch({ type: "UPDATE_TEXT", id, changes }), []);

  const updateShape = useCallback((id: string, changes: Partial<ShapeElement>) =>
    dispatch({ type: "UPDATE_SHAPE", id, changes }), []);

  const moveElement = useCallback((id: string, x: number, y: number) =>
    dispatch({ type: "MOVE_ELEMENT", id, x, y }), []);

  const reorderElement = useCallback((id: string, op: LayerOp) =>
    dispatch({ type: "REORDER", id, op }), []);

  const selectElement = useCallback((id: string | null) =>
    dispatch({ type: "SELECT", id }), []);

  const deleteSelected = useCallback(() => {
    if (design.selectedId) dispatch({ type: "DELETE", id: design.selectedId });
  }, [design.selectedId]);

  const setUnit = useCallback((unit: Unit) =>
    dispatch({ type: "SET_UNIT", unit }), []);

  return {
    design, addText, addShape, updateText, updateShape,
    moveElement, reorderElement, selectElement, deleteSelected, setUnit,
  };
}

export type { DesignElement };
