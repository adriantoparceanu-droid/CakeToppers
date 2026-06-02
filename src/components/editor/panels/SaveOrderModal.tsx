"use client";

import { useState, FormEvent } from "react";
import type { DesignState } from "@/types/design";
import type { SettingsDTO, FontDTO } from "@/types/api";
import type opentype from "opentype.js";
import type { FontMap } from "@/lib/svg/generator";
import { generateSVG } from "@/lib/svg/generator";

interface Props {
  design: DesignState;
  settings: SettingsDTO;
  fonts: FontDTO[];
  loadedFonts: Map<string, opentype.Font>;
  onClose: () => void;
}

export function SaveOrderModal({ design, settings, fonts, loadedFonts, onClose }: Props) {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [warnings, setWarnings]         = useState<string[]>([]);
  const [done, setDone]                 = useState(false);
  const [wantsEmail, setWantsEmail]     = useState(false);
  const [deliveryEmail, setDeliveryEmail] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setWarnings([]);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const clientName    = form.get("clientName")    as string;
    const clientContact = form.get("clientContact") as string;
    const notes         = form.get("notes")         as string;

    // Validare locală SVG
    const fontMap: FontMap = {};
    loadedFonts.forEach((font, id) => { fontMap[id] = font; });

    const { svg, widthMm, heightMm, warnings: svgWarnings } = generateSVG(
      design, fontMap, settings, clientName
    );

    if (!svg) {
      setError(svgWarnings.length > 0
        ? svgWarnings.join(" ")
        : "Design invalid. Adaugă text și asigură-te că fontul e încărcat."
      );
      setLoading(false);
      return;
    }

    // Verificare depășire planșă
    if (widthMm > settings.maxWidthMm || heightMm > settings.maxHeightMm) {
      setError(
        `Designul (${widthMm.toFixed(1)} × ${heightMm.toFixed(1)} mm) depășește ` +
        `limita planșei laser (${settings.maxWidthMm} × ${settings.maxHeightMm} mm). ` +
        `Micșorează elementele roșii din canvas.`
      );
      setLoading(false);
      return;
    }

    // Validare email livrare
    if (wantsEmail && !deliveryEmail.trim()) {
      setError("Introdu adresa de email pentru livrare.");
      setLoading(false);
      return;
    }

    // Trimitem la server
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName, clientContact,
        notes: notes || undefined,
        design, widthMm, heightMm,
        fontId: design.elements.find(e => e.kind === "text")
          ? (design.elements.find(e => e.kind === "text") as { fontId?: string })?.fontId
          : undefined,
        ...(wantsEmail && {
          deliveryEmail: deliveryEmail.trim(),
          deliveryPrice: settings.emailDeliveryPrice,
        }),
      }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      setWarnings(data.warnings ?? []);
      setDone(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Eroare la salvarea comenzii.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {done ? "Comandă trimisă!" : "Salvează comanda"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {done ? (
          // ── Ecran succes ──────────────────────────────────────────────────
          <div className="px-6 py-6 space-y-4">
            <div className="bg-green-50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">✓</div>
              <p className="text-sm font-semibold text-green-700">Comanda a fost trimisă!</p>
              <p className="text-xs text-green-600 mt-1">
                O vom procesa în cel mai scurt timp.
              </p>
            </div>

            {wantsEmail && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  📧 Livrare pe email solicitată
                </p>
                <p className="text-amber-700 text-xs">
                  {settings.emailDeliveryNote}
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  Email: <strong>{deliveryEmail}</strong> · Preț: <strong>{settings.emailDeliveryPrice} lei</strong>
                </p>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-gray-500">• {w}</p>
                ))}
              </div>
            )}

            <button onClick={onClose}
              className="w-full py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
              Închide
            </button>
          </div>
        ) : (
          // ── Formular ─────────────────────────────────────────────────────
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nume *</label>
              <input name="clientName" required placeholder="Ion Popescu"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon sau email *
              </label>
              <input name="clientContact" required placeholder="07xx xxx xxx"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notițe (opțional)
              </label>
              <textarea name="notes" rows={2}
                placeholder="Ex: lemn 3mm, culoare natur, urgent joi..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </div>

            {/* Checkbox livrare email */}
            {settings.emailDeliveryEnabled && (
              <div className={`rounded-xl border-2 p-4 transition-colors ${
                wantsEmail ? "border-brand-400 bg-brand-50" : "border-gray-200 bg-gray-50"
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsEmail}
                    onChange={e => setWantsEmail(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Primesc fișierul SVG pe email{" "}
                      <span className="text-brand-600">
                        +{settings.emailDeliveryPrice} lei
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Fișierul tăiat va fi trimis la adresa ta de email.
                    </p>
                  </div>
                </label>

                {wantsEmail && (
                  <div className="mt-3 ml-7">
                    <input
                      type="email"
                      value={deliveryEmail}
                      onChange={e => setDeliveryEmail(e.target.value)}
                      placeholder="adresa@email.ro"
                      className="w-full border border-brand-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                    <p className="text-xs text-amber-600 mt-1.5">
                      💳 {settings.emailDeliveryNote}
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Anulează
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50">
                {loading ? "Se procesează..." : "Trimite comanda"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
