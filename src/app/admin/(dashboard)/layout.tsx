// Middleware-ul protejează deja /admin. Layout-ul adaugă nav-ul admin.
import Link from "next/link";

const nav = [
  { href: "/admin/orders",   label: "Comenzi" },
  { href: "/admin/fonts",    label: "Fonturi" },
  { href: "/admin/shapes",   label: "Forme" },
  { href: "/admin/settings", label: "Setări" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white px-6 py-3 flex items-center gap-8">
        <span className="font-bold text-brand-400 text-lg">CakeTopper Admin</span>
        <nav className="flex gap-6 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-brand-300 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="POST" className="ml-auto">
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Deconectare
          </button>
        </form>
      </header>
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
