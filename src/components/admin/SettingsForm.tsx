"use client";

import { useState, useEffect, FormEvent } from "react";

interface Settings {
  maxWidthMm: number;
  maxHeightMm: number;
  cutStrokeWidthMm: number;
  brandName: string;
  emailDeliveryEnabled: boolean;
  emailDeliveryPrice: number;
  emailDeliveryNote: string;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
      <div className="sm:w-52 shrink-0">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function SettingsForm() {
  const [form, setForm] = useState<Settings>({
    maxWidthMm: 300, maxHeightMm: 200,
    cutStrokeWidthMm: 0.1, brandName: "CakeTopper Studio",
    emailDeliveryEnabled: true, emailDeliveryPrice: 15,
    emailDeliveryNote: "Vei fi contactat pentru detalii de plată.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setForm({
          maxWidthMm: d.maxWidthMm, maxHeightMm: d.maxHeightMm,
          cutStrokeWidthMm: d.cutStrokeWidthMm, brandName: d.brandName,
          emailDeliveryEnabled: d.emailDeliveryEnabled ?? true,
          emailDeliveryPrice: d.emailDeliveryPrice ?? 15,
          emailDeliveryNote: d.emailDeliveryNote ?? "Vei fi contactat pentru detalii de plată.",
        });
        setLoading(false);
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function num(field: keyof Settings, value: string) {
    setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }

  if (loading) return <div className="text-sm text-gray-400">Se încarcă...</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Setări</h1>
        <p className="text-sm text-gray-500 mt-0.5">Dimensiuni planșă laser, branding editor</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

        {/* Planșă */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Planșă laser
          </h2>
          <div className="space-y-4">
            <Field label="Lățime maximă" hint="Limita zonei de tăiere">
              <div className="flex items-center gap-2">
                <input
                  type="number" value={form.maxWidthMm} min={10} max={2000} step={1}
                  onChange={(e) => num("maxWidthMm", e.target.value)}
                  className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-500">mm</span>
              </div>
            </Field>
            <Field label="Înălțime maximă" hint="Limita zonei de tăiere">
              <div className="flex items-center gap-2">
                <input
                  type="number" value={form.maxHeightMm} min={10} max={2000} step={1}
                  onChange={(e) => num("maxHeightMm", e.target.value)}
                  className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-500">mm</span>
              </div>
            </Field>
            <Field label="Grosime linie cut" hint="Grosimea stroke-ului în SVG (LightBurn)">
              <div className="flex items-center gap-2">
                <input
                  type="number" value={form.cutStrokeWidthMm} min={0.01} max={1} step={0.01}
                  onChange={(e) => num("cutStrokeWidthMm", e.target.value)}
                  className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-500">mm</span>
                <span className="text-xs text-gray-400">(recomandat: 0.1)</span>
              </div>
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Branding
          </h2>
          <Field label="Nume afacere" hint="Apare în toolbar-ul editorului">
            <input
              type="text" value={form.brandName} maxLength={60}
              onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </Field>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Livrare SVG pe email
          </h2>
          <div className="space-y-4">
            <Field label="Activat" hint="Arată opțiunea în modal">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.emailDeliveryEnabled}
                  onChange={e => setForm(p => ({ ...p, emailDeliveryEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"/>
                <span className="text-sm text-gray-600">
                  {form.emailDeliveryEnabled ? "Activat" : "Dezactivat"}
                </span>
              </label>
            </Field>
            <Field label="Preț" hint="Afișat clientului în modal">
              <div className="flex items-center gap-2">
                <input type="number" value={form.emailDeliveryPrice} min={0} max={9999} step={1}
                  onChange={e => num("emailDeliveryPrice", e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
                <span className="text-sm text-gray-500">lei</span>
              </div>
            </Field>
            <Field label="Mesaj plată" hint="Text afișat sub email">
              <input type="text" value={form.emailDeliveryNote} maxLength={300}
                onChange={e => setForm(p => ({ ...p, emailDeliveryNote: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit" disabled={saving}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Se salvează..." : "Salvează"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Salvat</span>
          )}
        </div>
      </form>
    </div>
  );
}
