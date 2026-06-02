import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-fallback-secret-min-32-chars!!"
);

const LOGIN_PATH = "/admin/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutele care nu sunt sub /admin → ignorăm
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = request.cookies.get("ct_session")?.value;

  // ── Pagina de login ────────────────────────────────────────────────────────
  if (pathname.startsWith(LOGIN_PATH)) {
    if (token) {
      // Dacă utilizatorul are deja un token valid, trimitem direct în admin
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/admin/orders", request.url));
      } catch {
        // Token expirat/invalid → curăță cookie și lasă-l pe login
        const res = NextResponse.next();
        res.cookies.set({ name: "ct_session", value: "", path: "/", maxAge: 0 });
        return res;
      }
    }
    return NextResponse.next();
  }

  // ── Restul rutelor /admin (protejate) ─────────────────────────────────────
  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Token invalid → șterge cookie + redirect la login
    const res = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    res.cookies.set({ name: "ct_session", value: "", path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
