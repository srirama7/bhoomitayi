import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host");

  // Handle admin domain and localhost for easy testing
  const isAdminDomain = 
    hostname === "propnest-admin.vercel.app" || 
    hostname === "admin-bhoomitayi.vercel.app" ||
    hostname?.startsWith("localhost");

  if (isAdminDomain) {
    // If accessing root, rewrite to admin listings
    if (url.pathname === "/") {
      url.pathname = "/dashboard/admin/listings";
      return NextResponse.rewrite(url);
    }
    
    // Ensure all other admin dashboard paths are accessible
    // but redirect public routes (like /about, /houses, /listing/id) to admin listings 
    // to maintain separation if accessed from admin domain
    const isAdminPath = url.pathname.startsWith("/dashboard/admin");
    const isApi = url.pathname.startsWith("/api");
    const isAuth = url.pathname.startsWith("/auth");
    
    if (!isAdminPath && !isApi && !isAuth && url.pathname !== "/dashboard/admin/listings") {
       url.pathname = "/dashboard/admin/listings";
       return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
