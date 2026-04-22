import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  // Redirect back to the app — the frontend will handle verification
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bhoomitayi.vercel.app";
  return NextResponse.redirect(`${appUrl}/sell?payment_order=${orderId}`);
}
