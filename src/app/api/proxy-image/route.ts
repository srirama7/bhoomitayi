import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image from target: ${res.statusText}`);
    }

    const blob = await res.blob();
    const headers = new Headers();
    headers.set("Content-Type", blob.type || "image/jpeg");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day

    return new Response(blob, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error proxying image:", error);
    return NextResponse.json({ error: error.message || "Failed to load image" }, { status: 500 });
  }
}
