import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite importul fișierelor de font ca buffer în server actions / API routes
  serverExternalPackages: ["opentype.js", "konva"],

  webpack: (config: { resolve: { alias: Record<string, boolean> } }) => {
    // Konva/react-konva încearcă să importe 'canvas' pe server — nu există în Next.js
    config.resolve.alias["canvas"] = false;
    return config;
  },

  // Headers pentru fișierele de font servite din /api/fonts/[id]/file
  async headers() {
    return [
      {
        source: "/api/fonts/:id/file",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
