"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrderFull {
  id: string; clientName: string; clientContact: string;
  notes: string | null; status: string;
  widthMm: number; heightMm: number; fontName: string | null;
  deliveryEmail: string | null; deliveryPrice: number | null;
  createdAt: string; updatedAt: string;
}

const STATUS_LABEL: Record<string,string> = { NEW:"Nou", IN_PROGRESS:"În lucru", DONE:"Finalizat" };
const STATUS_COLOR: Record<string,string> = {
  NEW:"bg-blue-100 text-blue-700", IN_PROGRESS:"bg-amber-100 text-amber-700", DONE:"bg-green-100 text-green-700",
};

export function OrderDetail({ id }: { id: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`).then(r => r.json()).then(d => {
      setOrder(d); setNotes(d.notes ?? ""); setLoading(false);
    });
  }, [id]);

  async function setStatus(status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrder(prev => prev ? { ...prev, status } : prev);
  }

  async function saveNotes() {
    setSaving(true);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setEditNotes(false);
    setOrder(prev => prev ? { ...prev, notes } : prev);
  }

  async function deleteOrder() {
    if (!confirm("Ștergi această comandă? Acțiunea nu poate fi anulată.")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    router.push("/admin/orders");
  }

  if (loading) return <div className="text-sm text-gray-400">Se încarcă...</div>;
  if (!order)  return <div className="text-sm text-red-500">Comanda nu a fost găsită.</div>;

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link href="/admin/orders" className="hover:text-gray-600">Comenzi</Link>
        <span>/</span>
        <span className="text-gray-700">{order.clientName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.clientName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{order.clientContact}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium shrink-0 ${STATUS_COLOR[order.status]}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">

        {/* Preview SVG */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Preview design (roșu = linii de tăiere)</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center p-4"
            style={{ minHeight: 120 }}>
            {/* Browserul trimite cookie-ul automat pentru same-origin */}
            <img
              src={`/api/orders/${id}/svg`}
              alt="Design preview"
              className="max-w-full max-h-48 object-contain"
              style={{ background: "white" }}
            />
          </div>
        </div>

        {/* Livrare email */}
        {order.deliveryEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-800">📧 Livrare pe email solicitată</p>
                <p className="text-xs text-amber-700 mt-0.5">{order.deliveryEmail}</p>
              </div>
              <span className="text-sm font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                {order.deliveryPrice} lei
              </span>
            </div>
          </div>
        )}

        {/* Dimensiuni + font */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Dimensiuni</p>
            <p className="text-sm font-medium tabular-nums">{order.widthMm} × {order.heightMm} mm</p>
          </div>
          {order.fontName && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Font</p>
              <p className="text-sm font-medium">{order.fontName}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Creat</p>
            <p className="text-sm">{new Date(order.createdAt).toLocaleString("ro-RO")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Actualizat</p>
            <p className="text-sm">{new Date(order.updatedAt).toLocaleString("ro-RO")}</p>
          </div>
        </div>

        {/* Notițe */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400">Notițe</p>
            {!editNotes && (
              <button onClick={() => setEditNotes(true)} className="text-xs text-brand-600 hover:text-brand-700">
                {order.notes ? "Editează" : "+ Adaugă"}
              </button>
            )}
          </div>
          {editNotes ? (
            <div className="space-y-2">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"/>
              <div className="flex gap-2">
                <button onClick={saveNotes} disabled={saving}
                  className="px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50">
                  {saving ? "..." : "Salvează"}
                </button>
                <button onClick={() => { setEditNotes(false); setNotes(order.notes ?? ""); }}
                  className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Anulează
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{order.notes || <span className="text-gray-300 italic">Nicio notiță</span>}</p>
          )}
        </div>

        {/* Status workflow */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Schimbă status</p>
          <div className="flex flex-wrap gap-2">
            {["NEW","IN_PROGRESS","DONE"].map(s => (
              <button key={s} onClick={() => setStatus(s)} disabled={order.status === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  order.status === s
                    ? `${STATUS_COLOR[s]} cursor-default ring-2 ring-offset-1 ring-current`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Acțiuni fișier */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          <a href={`/api/orders/${id}/svg`}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            ↓ Descarcă SVG
          </a>
          <button onClick={deleteOrder}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">
            Șterge comanda
          </button>
        </div>
      </div>
    </div>
  );
}
