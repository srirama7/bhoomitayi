import { test } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test("generate pdf", async ({ page }) => {
  // Path to the markdown file
  const mdPath = "C:/Users/amogh/.gemini/antigravity-cli/brain/6455255a-a6dc-427a-913d-f3dbc88fd4be/deep_listing_tracking_plan.md";
  const mdContent = fs.readFileSync(mdPath, "utf-8");

  // Create a beautifully styled HTML page to convert
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bhoomitayi: Listing Tracking & Leakage Prevention Plan</title>
  <!-- Load Marked library to parse Markdown -->
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <!-- Load Mermaid library to parse diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <!-- Tailwind CSS for rich modern layout -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Outfit Google Font -->
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Outfit', sans-serif;
      color: #1f2937;
      line-height: 1.6;
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 700;
      color: #111827;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.75rem;
      margin-top: 2rem;
      margin-bottom: 1.5rem;
    }
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      page-break-after: avoid;
    }
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      page-break-after: avoid;
    }
    p {
      margin-bottom: 1rem;
    }
    ul {
      list-style-type: disc;
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }
    li {
      margin-bottom: 0.25rem;
    }
    code {
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }
    pre {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin-bottom: 1.5rem;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 0.875rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.75rem 1rem;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    blockquote {
      border-left: 4px solid #3b82f6;
      background-color: #eff6ff;
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
      border-radius: 0.25rem;
    }
    .mermaid {
      background-color: #fff;
      border: 1px solid #f3f4f6;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }
    /* Page break styling for PDF */
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body class="p-10 max-w-4xl mx-auto">
  <div id="content">Loading plan...</div>
  <script>
    // Prepare the markdown raw content safely escaping backticks and dollars
    const rawMarkdown = \`${mdContent.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;
    
    // Parse Markdown to HTML
    document.getElementById("content").innerHTML = marked.parse(rawMarkdown);

    // Initialize mermaid diagramming
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    });

    // Find and transform mermaid code blocks
    const codeBlocks = document.querySelectorAll("pre code.language-mermaid");
    codeBlocks.forEach((block, idx) => {
      const parentPre = block.parentElement;
      const mermaidDiv = document.createElement("div");
      mermaidDiv.className = "mermaid";
      mermaidDiv.id = "mermaid-" + idx;
      mermaidDiv.textContent = block.textContent;
      parentPre.replaceWith(mermaidDiv);
    });

    // Run mermaid render
    mermaid.run();
  </script>
</body>
</html>
  `;

  // Write temporary HTML file
  const tempHtmlPath = path.join(__dirname, "temp_render.html");
  fs.writeFileSync(tempHtmlPath, htmlContent);

  // Load the page
  await page.goto("file://" + tempHtmlPath);
  
  // Wait for libraries to load and render diagrams
  await page.waitForTimeout(4000);

  // Output PDF path
  const pdfPath = "C:/Users/amogh/bhoomitayi/deep_listing_tracking_plan.pdf";

  // Generate A4 PDF
  await page.pdf({
    path: pdfPath,
    format: "A4",
    margin: {
      top: "15mm",
      bottom: "15mm",
      left: "15mm",
      right: "15mm"
    },
    printBackground: true
  });

  // Clean up
  fs.unlinkSync(tempHtmlPath);
  console.log("SUCCESS: Generated PDF at " + pdfPath);
});
