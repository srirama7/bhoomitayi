import { NextResponse } from "next/server";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";

export async function POST(req: Request) {
  try {
    const { amount, customerName, customerEmail, customerPhone } = await req.json();

    const orderId = `listing_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_name: customerName || "Property Seller",
        customer_email: customerEmail || "seller@bhoomitayi.in",
        customer_phone: customerPhone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sell?order_id=${orderId}&status={order_status}`,
        notify_url: "",
      },
      order_note: "Property listing fee - BhoomiTayi",
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
      const errorData = await response.json();
      console.error("Cashfree order creation error:", errorData);
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
    console.error("Cashfree order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
