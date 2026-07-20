import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Google News RSS query for Indian real estate, property, stocks, and investments
    const rssUrl = "https://news.google.com/rss/search?q=indian+real+estate+property+stocks+investments+when:24h&hl=en-IN&gl=IN&ceid=IN:en";
    
    const res = await fetch(rssUrl, {
      next: { revalidate: 1800 }, // Cache feed for 30 minutes to stay within good use terms
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch RSS: ${res.statusText}`);
    }

    const xmlText = await res.text();

    // Regex to extract items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: any[] = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemContent.match(/<source[^>]*?>([\s\S]*?)<\/source>/);

      if (titleMatch && linkMatch) {
        let fullTitle = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim();
        let source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "Google News";
        
        // Strip source suffix from title if present
        let cleanTitle = fullTitle;
        if (fullTitle.endsWith(` - ${source}`)) {
          cleanTitle = fullTitle.substring(0, fullTitle.length - (source.length + 3));
        }

        items.push({
          title: cleanTitle,
          link: linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : "",
          source: source,
        });
      }
    }

    return NextResponse.json(items.slice(0, 15)); // Return top 15 news items
  } catch (error: any) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: error.message || "Failed to load news" }, { status: 500 });
  }
}
