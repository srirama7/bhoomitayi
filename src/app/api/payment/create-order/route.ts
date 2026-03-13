import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";

export async function POST(request: Request) {
  try {
    const { amount, userId, customerName, customerEmail, customerPhone } =
      await request.json();

    if (!amount || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const orderId = `order_${Date.now()}_${randomBytes(4).toString("hex")}`;

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: userId,
        customer_name: customerName || "Customer",
        customer_email: customerEmail || "customer@propnest.app",
        customer_phone: customerPhone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://propnest.vercel.app"}/api/payment/callback?order_id={order_id}`,
      },
    };

    const response = await fetch(CASHFREE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Cashfree order creation failed:", errData);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
