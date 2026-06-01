import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/verify") ||
    pathname.startsWith("/unlock") ||
    pathname === "/favicon.ico"
  );
}

export function proxy(request: NextRequest) {
  const privatePassword = process.env.PRIVATE_GAME_PASSWORD;
  if (!privatePassword) {
    return NextResponse.next();
  }

  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("gamebook_access")?.value;
  if (cookie === "granted") {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/unlock";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
