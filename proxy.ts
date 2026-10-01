import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { safeRelativePath } from "@/lib/safe-path";

const PUBLIC_PATHS = new Set(["/sign-in", "/sign-up"]);
const SESSION_COOKIES = [
  "better-auth.session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_data",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  let authHeaders: Headers;
  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    ({ headers: authHeaders, response: session } = await auth.api.getSession({
      headers: request.headers,
      returnHeaders: true,
    }));
  } catch (error) {
    // The database was unreachable, not the user unauthenticated. Don't
    // redirect or clear cookies; let the page's own getSession() surface the
    // failure through its error boundary.
    console.error("proxy: session lookup failed", error instanceof Error ? (error.cause ?? error) : error);
    return NextResponse.next();
  }

  if (!session && !isPublic) {
    const signIn = new URL("/sign-in", request.url);
    if (pathname !== "/") signIn.searchParams.set("next", pathname + search);
    const response = NextResponse.redirect(signIn);
    for (const name of SESSION_COOKIES) {
      if (request.cookies.has(name)) response.cookies.delete(name);
    }
    return response;
  }

  if (session && isPublic) {
    const next = safeRelativePath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  const response = NextResponse.next();
  const refreshed = authHeaders.get("set-cookie");
  if (refreshed) response.headers.set("set-cookie", refreshed);
  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|json|woff2?)$).*)",
  ],
};
