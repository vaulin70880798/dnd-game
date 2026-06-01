import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const privatePassword = process.env.PRIVATE_GAME_PASSWORD;

  if (!privatePassword) {
    return NextResponse.json({ ok: false, reason: "password-not-configured" }, { status: 400 });
  }

  const payload = (await request.json()) as { password?: string };

  if (!payload.password || payload.password !== privatePassword) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: "/" });
  response.cookies.set("gamebook_access", "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  return response;
}
