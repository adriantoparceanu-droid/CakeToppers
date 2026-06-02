"use client";

import { useState, useEffect, useRef, FormEvent } from "react";

interface Font {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export function FontsManager() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/fonts?all=1");
    if (res.ok) setFonts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    const name = nameRef.current?.value.trim();
    if (!file || !name) { setError("Completează numele și alege un fișier."); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name);

    const res = await fetch("/api/fonts", { method: "POST", body: fd });
    setUploading(false);

    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Eroare la upload.");
    }
  }

  async function toggleActive(font: Font) {
    await fetch(`/api/fonts/${font.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !font.active }),
    });
    setFonts((prev) =>
      prev.map((f) => f.id === font.id ? { ...f, active: !f.active } : f)
    );
  }

  async function saveRename(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/fonts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setFonts((prev) =>
      prev.map((f) => f.id === id ? { ...f, name: editName.trim() } : f)
    );
    setEditingId(null);
  }

  async function deleteFont(font: Font) {
    if (!confirm(`Ștergi fontul "${font.name}"? Comenzile existente nu sunt afectate.`)) return;
    await fetch(`/api/fonts/${font.id}`, { method: "DELETE" });
    setFonts((prev) => prev.filter((f) => f.id !== font.id));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fonturi</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Fonturile active apar în editorul public. Acceptăm .ttf, .otf, .woff
          </p>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Upload font nou</h2>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3">
          <input
            ref={nameRef}
            type="text"
            placeholder="Nume font (ex: Dancing Script)"
            required
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <label className="flex-1 flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
            <span className="text-gray-400">📎</span>
            <span className="text-gray-500 truncate">
              {fileRef.current?.files?.[0]?.name ?? "Alege fișier .ttf / .otf / .woff"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".ttf,.otf,.woff"
              className="hidden"
              onChange={() => {
                // forțăm re-render ca să apară numele fișierului
                setError(null);
              }}
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {uploading ? "Se încarcă..." : "Adaugă"}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Lista fonturi */}
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Se încarcă...</div>
      ) : fonts.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center">
          Niciun font adăugat încă.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {fonts.map((font) => (
            <div key={font.id} className="flex items-center gap-4 px-5 py-3">
              {/* Preview font name */}
              <div className="flex-1 min-w-0">
                {editingId === font.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(font.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
                    />
                    <button
                      onClick={() => saveRename(font.id)}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >Salvează</button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >Anulează</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{font.name}</span>
                    <button
                      onClick={() => { setEditingId(font.id); setEditName(font.name); }}
                      className="text-xs text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                      title="Redenumește"
                    >✏️</button>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Adăugat {new Date(font.createdAt).toLocaleDateString("ro-RO")}
                </p>
              </div>

              {/* Toggle activ */}
              <button
                onClick={() => toggleActive(font)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  font.active
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title={font.active ? "Click să dezactivezi" : "Click să activezi"}
              >
                {font.active ? "● Activ" : "○ Inactiv"}
              </button>

              {/* Șterge */}
              <button
                onClick={() => deleteFont(font)}
                className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                title="Șterge font"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
