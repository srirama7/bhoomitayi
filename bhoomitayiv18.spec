# BHOOMI TAYI V18 APPLICATION SPECIFICATION FILE

## Application Metadata
- **App Name**: BhoomiTayi
- **Package ID / App ID**: com.bhoomitayi.app
- **Version Code**: 5
- **Version Name**: 1.0 (v18 Release)
- **Framework**: Next.js 16 (App Router) + Tailwind CSS + CapacitorJS 8
- **Platform**: Android (APK)

## v18 Fixes & Changes

### 1. Listing Click Back-to-Home Redirection Fix
- **Problem**: In Next.js static exports (`output: 'export'`), dynamic routes like `/listing/[id]` are not fully generated for all arbitrary database document IDs (only pre-rendered paths are built). When running inside the native Capacitor WebView, clicking a listing card attempted to route to `/listing/abc` dynamically, which caused the local server to throw a 404. Next.js router then fell back to a hard browser reload, causing the WebView local web server to reload to `/` or fail, bringing users back to the main screen.
- **Solution**:
  - Added a dynamic routing fallback helper `getListingUrl` in [native-auth.ts](file:///C:/Users/amogh/bhoomitayi/src/lib/firebase/native-auth.ts).
  - Inside the native app container, the helper routes users to `/listing/1?id=<listing_id>` (since `/listing/1` is a pre-rendered static path that exists locally on the device).
  - Updated [listing-detail-client.tsx](file:///C:/Users/amogh/bhoomitayi/src/app/listing/[id]/listing-detail-client.tsx) to check for the `id` in query parameters (`?id=...`) and fall back to the dynamic path parameter if not found.
  - Wrapped [page.tsx](file:///C:/Users/amogh/bhoomitayi/src/app/listing/[id]/page.tsx) in a React `<Suspense>` boundary to allow client-side search parameter parsing on static pre-rendered routes.
  - Modified listing navigation links in the card, recently viewed items, favorites, and admin views to use `getListingUrl`.

### 2. Favicon & Search Logo Optimization
- **Problem**: The original `favicon.ico`, `icon.png`, and public logo files were renamed copies of a high-resolution 1.8 MB PNG image with non-standard dimensions. Some strict web crawlers (including Google's favicon crawler) reject oversized or non-square favicons and fall back to hosting/provider defaults (like the Vercel logo).
- **Solution**: Created and ran a script to generate properly optimized, standard web-resized copies of the circular `cropped_circle_image.png` logo:
  - `src/app/favicon.ico`: Resized to **32x32** pixels.
  - `src/app/icon.png`: Resized to **192x192** pixels.
  - `src/app/apple-icon.png`: Resized to **180x180** pixels.
  - `public/logo.png` & `logo-v2.png`: Resized to **512x512** pixels.
  - This ensures that Google Search's favicon bot can easily parse the image.

## Build Information
- **Build Output**: `bhoomitayiv18.apk` (Generated via Gradle debug build)
