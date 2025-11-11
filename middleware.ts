import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/checkout")) {
    const token = req.cookies.get("session")?.value
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("next", pathname + (req.nextUrl.search || ""))
      return NextResponse.redirect(loginUrl)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/checkout/:path*"],
}


