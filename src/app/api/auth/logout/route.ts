import { NextResponse } from "next/server";
import { cookieName } from "@/lib/auth";

export async function POST() {
  const loginUrl = new URL(
    "/admin/login",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
  );

  // 303 See Other → browserul convertește POST în GET și navighează la login
  const res = NextResponse.redirect(loginUrl, { status: 303 });

  // Ștergem cookie-ul cu aceleași atribute cu care a fost setat
  res.cookies.set({
    name: cookieName(),
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,                  // expiră imediat
    expires: new Date(0),
  });

  return res;
}
