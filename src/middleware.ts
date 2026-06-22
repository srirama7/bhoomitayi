import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Exclude _next/static, API routes, and auth
  const isNext = url.pathname.startsWith("/_next");
  const isApi = url.pathname.startsWith("/api");
  const isAuth = url.pathname.startsWith("/auth");
  const isStatic = url.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|avif|ico)$/);
  const isAdmin = url.pathname.startsWith("/admin");
  const isAdminApp = url.pathname.startsWith("/admin-app");
  const isListing = url.pathname.startsWith("/listing");
  
  if (!isNext && !isApi && !isAuth && !isStatic && !isAdmin && !isAdminApp && !isListing) {
    return NextResponse.redirect(new URL("/admin-app/index.html", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
