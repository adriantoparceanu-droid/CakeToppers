import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CakeTopper Studio",
  description: "Creează-ți propriul cake topper personalizat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro">
      <body className="antialiased bg-white text-gray-900">{children}</body>
    </html>
  );
}
