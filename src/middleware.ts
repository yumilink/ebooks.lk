import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPaths = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/author", roles: ["AUTHOR", "ADMIN"] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_PWA !== "true" &&
    (pathname === "/sw.js" ||
      pathname.startsWith("/workbox-") ||
      pathname.startsWith("/fallback-") ||
      pathname.startsWith("/worker-"))
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const rule = protectedPaths.find((p) => pathname.startsWith(p.prefix));
  if (!rule) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (!rule.roles.includes(token.role as string)) {
    return NextResponse.redirect(new URL("/books", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/author/:path*"],
};
