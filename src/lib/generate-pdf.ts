import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Listing } from "@/lib/types/database";

// Translation data loaded dynamically
async function getTranslations(lang: string) {
  const translations = await import(`../../public/locales/${lang}/common.json`);
  return translations.default || translations;
}

function formatDateForLocale(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr);
    const localeMap: Record<string, string> = {
      en: "en-IN",
      kn: "kn-IN",
      hi: "hi-IN",
      te: "te-IN",
      ml: "ml-IN",
      ta: "ta-IN",
    };
    return date.toLocaleDateString(localeMap[lang] || "en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export async function generateListingPDF(listing: Listing, lang: string = "en") {
  const t = await getTranslations(lang);
  const pdf = t.pdf;
  const form = t.form;

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // ── Page 1: Cover / Confirmation ──

  // Header band
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 45, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("BhoomiTayi", margin, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("bhoomitayi.com", margin, 32);

  // Reference ID on top right
  const refId = `BT-${listing.id.substring(0, 8).toUpperCase()}`;
  doc.setFontSize(10);
  doc.text(refId, pageWidth - margin, 22, { align: "right" });

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(pdf.title || "LISTING SUBMISSION CONFIRMATION", pageWidth / 2, 65, { align: "center" });

  // Horizontal line
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.8);
  doc.line(margin, 72, pageWidth - margin, 72);

  // Info table
  let y = 85;
  const labelX = margin;
  const valueX = margin + 55;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoRows = [
    [pdf.ref_number || "Reference Number", refId],
    [pdf.applicant_name || "Applicant Name", (listing as unknown as Record<string, unknown>).owner_name as string || "N/A"],
    [pdf.business_service || "Business / Service", listing.title],
    [pdf.category || "Category", listing.category.charAt(0).toUpperCase() + listing.category.slice(1)],
    [pdf.submission_date || "Submission Date", formatDateForLocale(listing.created_at, lang)],
    [pdf.status || "Status", listing.status.toUpperCase()],
  ];

  for (const [label, value] of infoRows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, labelX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(String(value || "N/A"), valueX, y);
    y += 10;
  }

  // Status badge
  y += 5;
  if (listing.status === "active") {
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin, y - 5, contentWidth, 14, 3, 3, "F");
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("APPROVED", pageWidth / 2, y + 3, { align: "center" });
  }

  // Confirmation text
  y += 25;
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  const confirmText = pdf.confirmation_text || "This document confirms that the above listing has been duly submitted on the portal.";
  const splitText = doc.splitTextToSize(confirmText, contentWidth);
  doc.text(splitText, pageWidth / 2, y, { align: "center" });

  // Footer for page 1
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y - 5, pageWidth - margin, y - 5);
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.text(`${pdf.page || "Page"} 1 | ${refId} | ${pdf.generated_on || "Generated on"}: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
  doc.text("BhoomiTayi | bhoomitayi.com", pageWidth / 2, y + 5, { align: "center" });

  // ── Page 2: Full Application Data ──
  doc.addPage();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(pdf.application_details || "APPLICATION DETAILS", pageWidth / 2, 13, { align: "center" });

  // Listing details table
  const tableData: string[][] = [];

  tableData.push([form.title || "Title", listing.title]);
  tableData.push([form.description || "Description", listing.description?.substring(0, 200) || "N/A"]);
  tableData.push([form.price || "Price", formatPrice(listing.price)]);
  tableData.push([form.address || "Address", listing.address]);
  tableData.push([form.pincode || "Pincode", listing.pincode]);
  tableData.push([pdf.category || "Category", listing.category]);
  tableData.push([form.transaction_type || "Transaction Type", listing.transaction_type]);

  // Contact details
  const listingAny = listing as unknown as Record<string, unknown>;
  if (listingAny.owner_name) tableData.push([form.owner_name || "Owner Name", String(listingAny.owner_name)]);
  if (listingAny.owner_phone) tableData.push([form.owner_phone || "Phone", String(listingAny.owner_phone)]);
  if (listingAny.owner_email) tableData.push([form.owner_email || "Email", String(listingAny.owner_email)]);

  // Property-specific details
  const details = listing.details as Record<string, unknown> | null;
  if (details) {
    const detailFieldMap: Record<string, string> = {
      bedrooms: form.bedrooms || "Bedrooms",
      bathrooms: form.bathrooms || "Bathrooms",
      area_sqft: form.area_sqft || "Area (sq.ft)",
      furnishing: form.furnishing || "Furnishing",
      floors: form.floors || "Floors",
      parking: form.parking || "Parking",
      year_built: form.year_built || "Year Built",
      land_type: form.land_type || "Land Type",
      facing: form.facing || "Facing",
      road_width_ft: form.road_width || "Road Width (ft)",
      boundary_wall: form.boundary_wall || "Boundary Wall",
      is_corner_plot: form.corner_plot || "Corner Plot",
      legal_clearance: form.legal_clearance || "Legal Clearance",
      rent_per_month: form.rent_per_month || "Rent per Month",
      security_deposit: form.security_deposit || "Security Deposit",
      gender_preference: form.gender_preference || "Gender Preference",
      occupancy_type: form.occupancy_type || "Occupancy Type",
      meals_included: form.meals_included || "Meals Included",
      wifi: form.wifi || "WiFi",
      ac: form.ac || "AC",
      commercial_type: form.commercial_type || "Commercial Type",
      vehicle_type: form.vehicle_type || "Vehicle Type",
      brand: form.brand || "Brand",
      model: form.model || "Model",
      year: form.year || "Year",
      fuel_type: form.fuel_type || "Fuel Type",
      transmission: form.transmission || "Transmission",
      km_driven: form.km_driven || "KM Driven",
      condition: form.condition || "Condition",
      commodity_type: form.commodity_type || "Commodity Type",
    };

    for (const [key, label] of Object.entries(detailFieldMap)) {
      if (details[key] !== undefined && details[key] !== null && details[key] !== "") {
        let val = details[key];
        if (typeof val === "boolean") val = val ? "Yes" : "No";
        if (typeof val === "number") val = val.toLocaleString("en-IN");
        tableData.push([label, String(val)]);
      }
    }
  }

  autoTable(doc, {
    startY: 30,
    head: [[pdf.field || "Field", pdf.value || "Value"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });

  // Footer for page 2
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.text(`${pdf.page || "Page"} 2 | ${refId} | ${pdf.generated_on || "Generated on"}: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 18, { align: "center" });
  doc.text("BhoomiTayi | bhoomitayi.com", pageWidth / 2, pageHeight - 13, { align: "center" });

  // Download
  const filename = `${refId}_submission_${lang}.pdf`;
  doc.save(filename);
}
