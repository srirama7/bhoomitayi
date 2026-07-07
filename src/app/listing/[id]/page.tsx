import { Suspense } from "react";
import ListingDetailClient from "./listing-detail-client";

export const dynamic = "force-static";

export function generateStaticParams() {
  // Return a dummy route id so next build compiles the route for static export
  return [{ id: "1" }];
}

export default function ListingDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center font-semibold text-lg text-muted-foreground animate-pulse">
          Loading listing details...
        </div>
      </div>
    }>
      <ListingDetailClient />
    </Suspense>
  );
}

