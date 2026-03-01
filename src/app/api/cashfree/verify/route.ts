import { NextResponse } from "next/server";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const CASHFREE_API_URL = "https://api.cashfree.com/pg/orders";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    const response = await fetch(`${CASHFREE_API_URL}/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to verify payment" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      orderId: data.order_id,
      orderStatus: data.order_status,
      orderAmount: data.order_amount,
    });
  } catch (error) {
    console.error("Cashfree verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
