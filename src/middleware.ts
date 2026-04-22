import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host");

  // Handle admin domain
  const isAdminDomain = 
    hostname?.includes("admin-bhoomitayi") ||
    hostname?.includes("admin.vercel.app");

  if (isAdminDomain) {
    // If accessing root, rewrite to admin listings
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL("/dashboard/admin/listings", request.url));
    }
    
    // Ensure all other admin dashboard paths are accessible
    const isAdminPath = url.pathname.startsWith("/dashboard/admin");
    const isApi = url.pathname.startsWith("/api");
    const isAuth = url.pathname.startsWith("/auth");
    const isNext = url.pathname.startsWith("/_next");
    const isStatic = url.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/);
    
    if (!isAdminPath && !isApi && !isAuth && !isNext && !isStatic) {
       return NextResponse.rewrite(new URL("/dashboard/admin/listings", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
