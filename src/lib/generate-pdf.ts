import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Listing } from "@/lib/types/database";

// Always load English translations to avoid any unicode/font rendering bugs
async function getTranslations() {
  try {
    const translations = await import(`../../public/locales/en/common.json`);
    return translations.default || translations;
  } catch (err) {
    console.error("Failed to load translations:", err);
    return { form: {} };
  }
}

function formatDateForLocale(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const dayMonth = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
    });
    return `${dayMonth} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number): string {
  if (!price) return "FREE";
  if (price >= 10000000) return `INR ${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `INR ${(price / 100000).toFixed(2)} L`;
  if (price >= 1000) return `INR ${(price / 1000).toFixed(1)}K`;
  return `INR ${price.toLocaleString("en-IN")}`;
}

export async function generateListingPDF(listing: Listing, _lang: string = "en") {
  try {
    const t = await getTranslations();
    const form = t.form || {};

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    const refId = `BT-${listing.id.substring(0, 8).toUpperCase()}`;

    // ── Header Section ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(37, 99, 235); // Blue brand color
    doc.text("BHOOMITAYI", margin, 30);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("123 Tech Park, Bengaluru, Karnataka 560001", margin, 38);
    doc.text("support@bhoomitayi.com | www.bhoomitayi.com", margin, 44);

    // QR Code Generation
    try {
      const QRCode = await import("qrcode");
      const listingUrl = `https://bhoomitayi.com/listing/${listing.id}`;
      const qrDataUrl = await QRCode.toDataURL(listingUrl, { margin: 0 });
      doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 30, 20, 30, 30);
    } catch (qrErr) {
      console.error("QR Code generation skipped:", qrErr);
    }

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, 55, pageWidth - margin, 55);

    // ── Invoice / Bill Header ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text("INVOICE", pageWidth - margin, 70, { align: "right" });

    // Bill To details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("BILL TO:", margin, 70);
    
    const listingAny = listing as unknown as Record<string, unknown>;
    const ownerName = String(listingAny.owner_name || "Valued Customer");
    const ownerPhone = String(listingAny.owner_phone || "N/A");
    const ownerEmail = String(listingAny.owner_email || "N/A");

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(ownerName, margin, 76);
    doc.text(`Phone: ${ownerPhone}`, margin, 82);
    doc.text(`Email: ${ownerEmail}`, margin, 88);

    // Meta Details
    const metaX = pageWidth - margin - 60;
    doc.setTextColor(120, 120, 120);
    doc.text("Invoice No:", metaX, 76);
    doc.text("Date:", metaX, 82);
    doc.text("Status:", metaX, 88);

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(refId, pageWidth - margin, 76, { align: "right" });
    doc.text(formatDateForLocale(listing.created_at), pageWidth - margin, 82, { align: "right" });
    
    // Status text color
    const isApproved = listing.status === "active";
    if (isApproved) doc.setTextColor(22, 101, 52); // Green
    else doc.setTextColor(220, 38, 38); // Red
    doc.text((listing.status || "ACTIVE").toUpperCase(), pageWidth - margin, 88, { align: "right" });

    // ── Line Items Table ──
    const tableData: string[][] = [];
    tableData.push(["Service Description", "Premium Listing Registration"]);
    tableData.push(["Property Title", listing.title || "N/A"]);
    tableData.push(["Category", (listing.category || "").toUpperCase()]);
    tableData.push(["Location", listing.address || "N/A"]);
    if (listing.pincode) tableData.push(["Pincode", listing.pincode]);
    
    const details = listing.details as Record<string, unknown> | null;
    if (details) {
      if (details.area_sqft) tableData.push(["Total Area", `${details.area_sqft} sq.ft`]);
      if (details.bedrooms) tableData.push(["Bedrooms", String(details.bedrooms)]);
      if (details.furnishing) tableData.push(["Furnishing", String(details.furnishing)]);
      if (details.brand) tableData.push(["Brand", String(details.brand)]);
      if (details.model) tableData.push(["Model", String(details.model)]);
      if (details.year) tableData.push(["Year Built/Make", String(details.year || details.year_built)]);
    }

    autoTable(doc, {
      startY: 105,
      head: [["DESCRIPTION", "DETAILS"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 11,
        cellPadding: 8,
      },
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 7,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80, textColor: [30, 30, 30] },
        1: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });

    // ── Total Section ──
    // @ts-ignore - jspdf-autotable extends jsPDF with lastAutoTable
    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth - margin - 85, finalY - 5, 85, 30, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text("TOTAL DUE:", pageWidth - margin - 80, finalY + 6);
    
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text(listing.price != null ? formatPrice(listing.price) : "N/A", pageWidth - margin - 5, finalY + 17, { align: "right" });

    // ── Footer ──
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 35, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("This is a computer generated invoice and does not require a signature.", pageWidth / 2, pageHeight - 29, { align: "center" });
    
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, pageHeight - 14, { align: "center" });

    // Trigger Download
    const filename = `${refId}_Invoice.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error("Critical error in generateListingPDF:", error);
    // Absolute fallback
    try {
      const doc = new jsPDF();
      doc.text("Error generating PDF invoice.", 10, 10);
      doc.save(`error_${Date.now()}.pdf`);
    } catch (e) {}
  }
}
