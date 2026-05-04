import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ApprovalEmailRequest = {
  listingId?: string;
  listingTitle?: string;
  ownerEmail?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultEmailFrom = "softspring777@gmail.com";

export async function POST(request: Request) {
  const smtpUser = process.env.SMTP_USER || defaultEmailFrom;
  const smtpAppPassword = process.env.SMTP_APP_PASSWORD;
  const emailFrom = process.env.LISTING_APPROVAL_EMAIL_FROM || smtpUser;

  if (!smtpUser || !smtpAppPassword) {
    return NextResponse.json(
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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const listingTitle = body.listingTitle?.trim();
  const ownerEmail = body.ownerEmail?.trim();

  if (!listingTitle || !ownerEmail || !emailPattern.test(ownerEmail)) {
    return NextResponse.json(
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

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpAppPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: ownerEmail,
      subject,
      html,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to send approval email.",
        details: error instanceof Error ? error.message : "Unknown SMTP error",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
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
