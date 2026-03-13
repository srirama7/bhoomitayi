import { NextResponse } from "next/server";
import QRCode from "qrcode";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";

export async function POST(request: Request) {
  try {
    const { orderId, paymentSessionId } = await request.json();

    if (!orderId || !paymentSessionId) {
      return NextResponse.json(
        { error: "Missing orderId or paymentSessionId" },
        { status: 400 }
      );
    }

    // Call Cashfree pay API to get UPI QR code
    const response = await fetch(`${CASHFREE_API_URL}/${orderId}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify({
        payment_session_id: paymentSessionId,
        payment_method: {
          upi: {
            channel: "qrcode",
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree UPI pay failed:", data);
      return NextResponse.json(
        { error: data.message || "Failed to initiate UPI payment" },
        { status: 500 }
      );
    }

    const upiLink = data?.data?.payload?.qrcode;

    if (!upiLink) {
      console.error("No QR code in Cashfree response:", data);
      return NextResponse.json(
        { error: "Failed to generate UPI QR code" },
        { status: 500 }
      );
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(upiLink, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return NextResponse.json({
      qrDataUrl,
      upiLink,
      cfPaymentId: data?.data?.cf_payment_id,
    });
  } catch (error) {
    console.error("UPI pay initiation failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate UPI payment" },
      { status: 500 }
    );
  }
}
