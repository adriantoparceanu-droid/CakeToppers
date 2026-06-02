"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Order {
  id: string; clientName: string; clientContact: string;
  notes: string | null; status: string;
  widthMm: number; heightMm: number; fontName: string | null;
  deliveryEmail: string | null; deliveryPrice: number | null;
  createdAt: string; updatedAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "Nou", IN_PROGRESS: "În lucru", DONE: "Finalizat",
};
const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  DONE: "bg-green-100 text-green-700",
};
const NEXT_STATUS: Record<string, { label: string; value: string } | null> = {
  NEW: { label: "Preia", value: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Finalizează", value: "DONE" },
  DONE: null,
};

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const url = filter === "ALL" ? "/api/orders" : `/api/orders?status=${filter}`;
    const res = await fetch(url);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  async function deleteOrder(id: string, name: string) {
    if (!confirm(`Ștergi comanda lui "${name}"?`)) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    setOrders(prev => prev.filter(o => o.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  function toggleAll() {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map(o => o.id)));
  }

  async function exportZip() {
    if (selected.size === 0) return;
    setExporting(true);
    const res = await fetch("/api/admin/orders/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setExporting(false);
    if (!res.ok) { alert("Eroare la export."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `caketoppers_${selected.size}.zip`; a.click();
    URL.revokeObjectURL(url);
  }

  const filters = ["ALL","NEW","IN_PROGRESS","DONE"];
  const filterLabel: Record<string,string> = {
    ALL:"Toate", NEW:"Noi", IN_PROGRESS:"În lucru", DONE:"Finalizate",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comenzi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} comenzi</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={exportZip} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {exporting ? "Se exportă..." : `↓ ZIP (${selected.size})`}
            </button>
          )}
          <button onClick={load}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
            ↺ Reîncarcă
          </button>
        </div>
      </div>

      {/* Filtre status */}
      <div className="flex gap-1 mb-4">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}>
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-12 text-center">Se încarcă...</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-gray-400 py-12 text-center bg-white rounded-xl border border-gray-200">
          {filter === "ALL" ? "Nicio comandă încă." : `Nicio comandă cu statusul „${filterLabel[filter]}".`}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="py-3 pl-4 pr-2 w-8">
                  <input type="checkbox" checked={selected.size === orders.length && orders.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"/>
                </th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Client</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500 hidden sm:table-cell">Dimensiuni</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500 hidden md:table-cell">Dată</th>
                <th className="py-3 px-3 text-left font-medium text-gray-500">Status</th>
                <th className="py-3 px-3 text-right font-medium text-gray-500">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => {
                const next = NEXT_STATUS[order.status];
                return (
                  <tr key={order.id}
                    className={`hover:bg-gray-50 transition-colors ${selected.has(order.id) ? "bg-blue-50" : ""}`}>
                    <td className="py-3 pl-4 pr-2">
                      <input type="checkbox" checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"/>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-gray-900">{order.clientName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.clientContact}</p>
                      {order.deliveryEmail && (
                        <p className="text-xs text-amber-600 mt-0.5 font-medium">
                          📧 {order.deliveryEmail} · {order.deliveryPrice} lei
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]" title={order.notes}>
                          📝 {order.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      <span className="text-gray-700 tabular-nums">
                        {order.widthMm} × {order.heightMm} mm
                      </span>
                      {order.fontName && (
                        <p className="text-xs text-gray-400 mt-0.5">{order.fontName}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-500 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString("ro-RO", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[order.status] ?? ""}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Avansează status */}
                        {next && (
                          <button onClick={() => setStatus(order.id, next.value)}
                            className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                            {next.label}
                          </button>
                        )}
                        {/* Download SVG */}
                        <a href={`/api/orders/${order.id}/svg`}
                          className="px-2.5 py-1 text-xs font-medium bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg transition-colors"
                          title="Descarcă SVG">
                          ↓ SVG
                        </a>
                        {/* Detalii */}
                        <Link href={`/admin/orders/${order.id}`}
                          className="px-2.5 py-1 text-xs font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors">
                          Detalii
                        </Link>
                        {/* Șterge */}
                        <button onClick={() => deleteOrder(order.id, order.clientName)}
                          className="px-2 py-1 text-gray-300 hover:text-red-500 transition-colors text-base leading-none"
                          title="Șterge">×</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
