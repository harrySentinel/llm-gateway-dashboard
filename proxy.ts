import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  // Check for a Supabase session cookie — no network call, no env var dependency.
  // createBrowserClient stores the session as "sb-<projectRef>-auth-token".
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.includes("auth-token") && c.value.length > 0);

  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
