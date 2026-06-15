import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ApprovalEmailRequest = {
  listingId?: string;
  listingTitle?: string;
  ownerEmail?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultEmailFrom = "bhoomitayi74@gmail.com";
const defaultAllowedOrigin = "https://bhoomitayi.vercel.app";
const allowedOrigins = new Set([
  defaultAllowedOrigin,
  "https://bhoomitayi.ayushreeherbals.com",
  "https://propnest-admin-official.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
]);

// Add custom origins from env
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",").forEach((o) => {
    const trimmed = o.trim();
    if (trimmed) allowedOrigins.add(trimmed);
  });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: Request) {
  const smtpUser = process.env.SMTP_USER || defaultEmailFrom;
  const smtpAppPassword = process.env.SMTP_APP_PASSWORD;
  const emailFrom = process.env.LISTING_APPROVAL_EMAIL_FROM || smtpUser;

  if (!smtpUser || !smtpAppPassword) {
    return json(
      request,
      {
        error:
          "Email is not configured. Set SMTP_USER and SMTP_APP_PASSWORD in your environment.",
      },
      { status: 500 }
    );
  }

  let body: ApprovalEmailRequest;
  try {
    body = (await request.json()) as ApprovalEmailRequest;
  } catch {
    return json(request, { error: "Invalid JSON body." }, { status: 400 });
  }

  const listingTitle = body.listingTitle?.trim();
  const ownerEmail = body.ownerEmail?.trim();

  if (!listingTitle || !ownerEmail || !emailPattern.test(ownerEmail)) {
    return json(
      request,
      { error: "A valid listingTitle and ownerEmail are required." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const listingUrl =
    appUrl && body.listingId
      ? `${appUrl}/listing/${encodeURIComponent(body.listingId)}`
      : null;

  const subject = "Your listing payment has been listed";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">Listing approved</h2>
      <p>Your payment has been listed and your listing is now active.</p>
      <p><strong>Listing:</strong> ${escapeHtml(listingTitle)}</p>
      ${
        listingUrl
          ? `<p><a href="${listingUrl}" style="color:#2563eb">View your listing</a></p>`
          : ""
      }
      <p>Thank you for using Bhoomitayi.</p>
    </div>
  `;

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpSecure = process.env.SMTP_SECURE !== "false";

  const transporterOptions: any = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpAppPassword,
    },
  };

  // Use Gmail service helper if it's Gmail and no custom host is defined
  if (!process.env.SMTP_HOST && (smtpUser.endsWith("@gmail.com") || emailFrom.endsWith("@gmail.com"))) {
    transporterOptions.service = "gmail";
    delete transporterOptions.host;
    delete transporterOptions.port;
    delete transporterOptions.secure;
  }

  const transporter = nodemailer.createTransport(transporterOptions);

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: ownerEmail,
      subject,
      html,
    });
  } catch (error) {
    return json(
      request,
      {
        error: "Failed to send approval email.",
        details: error instanceof Error ? error.message : "Unknown SMTP error",
      },
      { status: 502 }
    );
  }

  return json(request, { ok: true });
}

function json(request: Request, body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: getCorsHeaders(request),
  });
}

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  const allowOrigin = allowedOrigins.has(origin) ? origin : defaultAllowedOrigin;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
