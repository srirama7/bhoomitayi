import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET(request?: Request) {
  if (process.env.BUILD_TARGET === "capacitor" || !request?.url) {
    return NextResponse.json({ status: "static_export" });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    // Redirect back to the app — the frontend will handle verification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bhoomitayi.vercel.app";
    if (orderId) {
      return NextResponse.redirect(`${appUrl}/sell?payment_order=${orderId}`);
    }
    return NextResponse.json({ message: "Callback received" });
  } catch {
    return NextResponse.json({ message: "Callback received" });
  }
}
