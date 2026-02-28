import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Firebase Auth is handled client-side, so middleware just passes through.
  // Protected route checks are done in the client components via AuthProvider.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
