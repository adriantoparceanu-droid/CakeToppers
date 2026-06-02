"use client";

import { useState, useEffect } from "react";

interface Shape {
  id: string; name: string; slug: string; active: boolean; sortOrder: number;
}

const SLUG_ICONS: Record<string, string> = {
  stick: "🏮", heart: "❤️", circle: "⭕", star: "⭐",
};

export function ShapesManager() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shapes").then((r) => r.json()).then((d) => {
      setShapes(d);
      setLoading(false);
    });
  }, []);

  async function toggle(shape: Shape) {
    await fetch("/api/shapes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: shape.id, active: !shape.active }),
    });
    setShapes((prev) =>
      prev.map((s) => s.id === shape.id ? { ...s, active: !s.active } : s)
    );
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Forme</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Formele active apar în editorul public pentru clienți
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Se încarcă...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {shapes.map((shape) => (
            <div key={shape.id} className="flex items-center gap-4 px-5 py-4">
              <span className="text-2xl">{SLUG_ICONS[shape.slug] ?? "◻️"}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{shape.name}</p>
                <p className="text-xs text-gray-400 font-mono">{shape.slug}</p>
              </div>
              <button
                onClick={() => toggle(shape)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  shape.active
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {shape.active ? "● Activă" : "○ Inactivă"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-xl text-xs text-blue-700">
        <strong>Pasul următor:</strong> formele vor fi integrate în editor în Pasul 5.
        Deocamdată poți activa/dezactiva care vor apărea.
      </div>
    </div>
  );
}
