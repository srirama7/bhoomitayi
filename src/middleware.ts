import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host");

  // Handle admin domain and localhost for easy testing
  if (hostname === "propnest-admin.vercel.app" || hostname?.startsWith("localhost")) {
    // Redirect root to admin listings page
    if (url.pathname === "/") {
      url.pathname = "/dashboard/admin/listings";
      return NextResponse.redirect(url, { status: 302 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
