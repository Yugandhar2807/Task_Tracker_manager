import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { AUTH_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/signup"];
const PUBLIC_API_PREFIXES = ["/api/auth/login", "/api/auth/signup", "/api/health"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/" ||
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    // If user is already logged in and visits /login or /signup, push them forward
    if (PUBLIC_PATHS.includes(pathname)) {
      const token = req.cookies.get(AUTH_COOKIE)?.value;
      if (token) {
        const user = await verifyToken(token);
        if (user) return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  }

  // Protected paths
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
