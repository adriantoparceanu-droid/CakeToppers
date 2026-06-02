// Tipuri pentru request/response API

import type { DesignState } from "./design";

// ─── Fonts ────────────────────────────────────────────────────────────────────

export interface FontDTO {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

// ─── Shapes ───────────────────────────────────────────────────────────────────

export interface ShapeDTO {
  id: string;
  name: string;
  slug: string;
  svgPath: string | null;
  active: boolean;
  sortOrder: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface SettingsDTO {
  maxWidthMm: number;
  maxHeightMm: number;
  cutStrokeWidthMm: number;
  brandName: string;
  logoUrl: string | null;
  emailDeliveryEnabled: boolean;
  emailDeliveryPrice: number;
  emailDeliveryNote: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = "NEW" | "IN_PROGRESS" | "DONE";

export interface CreateOrderBody {
  clientName: string;
  clientContact: string;
  notes?: string;
  design: DesignState;
  widthMm: number;
  heightMm: number;
  fontId?: string;
  deliveryEmail?: string;
  deliveryPrice?: number;
}

export interface OrderDTO {
  id: string;
  clientName: string;
  clientContact: string;
  notes: string | null;
  status: OrderStatus;
  widthMm: number;
  heightMm: number;
  fontId: string | null;
  fontName: string | null;
  deliveryEmail: string | null;
  deliveryPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetailDTO extends OrderDTO {
  design: DesignState;
}
