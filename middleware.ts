import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./src/server/auth/jwt";

// Pages that must remain reachable without a session.
const PUBLIC_PAGES = new Set(["/login", "/register"]);

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  try {
    await verifySessionToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth endpoints handle their own logic and must stay open.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(request);
  const isPublicPage = PUBLIC_PAGES.has(pathname);

  if (!authed) {
    // Protected API calls get a clean 401 instead of an HTML redirect.
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isPublicPage) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users shouldn't sit on the login/register screens.
  if (isPublicPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
