import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    // API routes return 401 JSON instead of redirecting
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Pages redirect to login with a callbackUrl
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    // Exclude: NextAuth handlers, cron (own auth), worker (own auth),
    // static assets, favicon, and the login page itself
    "/((?!api/auth|api/cron|api/worker|_next/static|_next/image|favicon\\.ico|login).*)",
  ],
};
