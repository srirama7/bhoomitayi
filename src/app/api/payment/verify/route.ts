import { NextResponse } from "next/server";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    // Fetch order status from Cashfree
    const orderResponse = await fetch(`${CASHFREE_API_URL}/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    if (!orderResponse.ok) {
      const errData = await orderResponse.json();
      console.error("Cashfree order fetch failed:", errData);
      return NextResponse.json(
        { error: "Failed to verify payment" },
        { status: 500 }
      );
    }

    const orderData = await orderResponse.json();

    // Fetch payment details
    const paymentsResponse = await fetch(
      `${CASHFREE_API_URL}/${orderId}/payments`,
      {
        method: "GET",
        headers: {
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
        },
      }
    );

    let paymentDetails = null;
    if (paymentsResponse.ok) {
      const payments = await paymentsResponse.json();
      if (Array.isArray(payments) && payments.length > 0) {
        paymentDetails = payments[0];
      }
    }

    const isPaid = orderData.order_status === "PAID";

    if (isPaid) {
      return NextResponse.json({
        verified: true,
        paymentId: paymentDetails?.cf_payment_id || orderId,
        paymentRef: `PN-${Date.now().toString(36).toUpperCase()}`,
        orderId: orderData.order_id,
        amount: orderData.order_amount,
        paymentMethod: paymentDetails?.payment_group || "unknown",
        paidAt: orderData.order_expiry_time || new Date().toISOString(),
      });
    }

    return NextResponse.json({
      verified: false,
      orderStatus: orderData.order_status,
      error:
        orderData.order_status === "EXPIRED"
          ? "Payment session expired. Please try again."
          : "Payment not completed. Please try again.",
    });
  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
