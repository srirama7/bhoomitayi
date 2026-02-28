"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Phone, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";

interface InquiryWithDetails {
  id: string;
  listing_id: string;
  sender_id: string;
  message: string;
  phone: string | null;
  created_at: string;
  listing: {
    id: string;
    title: string;
  } | null;
  senderProfile: {
    full_name: string;
    phone: string | null;
  } | null;
}

export default function InquiriesPage() {
  const { user, loading: authLoading } = useAuthStore();
  const [inquiries, setInquiries] = useState<InquiryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchInquiries = async () => {
      try {
        // First get user's listing IDs
        const userListingsQuery = query(
          collection(db, "listings"),
          where("user_id", "==", user.uid)
        );
        const listingsSnap = await getDocs(userListingsQuery);

        if (listingsSnap.empty) {
          setInquiries([]);
          setLoading(false);
          return;
        }

        const listingIds = listingsSnap.docs.map((d) => d.id);

        // Build a map of listing id -> title for quick lookup
        const listingMap = new Map<string, { id: string; title: string }>();
        listingsSnap.docs.forEach((d) => {
          const data = d.data();
          listingMap.set(d.id, { id: d.id, title: data.title });
        });

        // Fetch inquiries for those listings (chunked for Firestore 'in' limit)
        const allInquiries: InquiryWithDetails[] = [];
        const chunks: string[][] = [];
        for (let i = 0; i < listingIds.length; i += 30) {
          chunks.push(listingIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
          const inquiriesQuery = query(
            collection(db, "inquiries"),
            where("listing_id", "in", chunk)
          );
          const inquiriesSnap = await getDocs(inquiriesQuery);

          for (const inquiryDoc of inquiriesSnap.docs) {
            const data = inquiryDoc.data();

            // Fetch sender profile
            let senderProfile: InquiryWithDetails["senderProfile"] = null;
            if (data.sender_id) {
              const profileSnap = await getDoc(
                doc(db, "profiles", data.sender_id)
              );
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                senderProfile = {
                  full_name: profileData.full_name,
                  phone: profileData.phone ?? null,
                };
              }
            }

            allInquiries.push({
              id: inquiryDoc.id,
              listing_id: data.listing_id,
              sender_id: data.sender_id,
              message: data.message,
              phone: data.phone ?? null,
              created_at: data.created_at,
              listing: listingMap.get(data.listing_id) ?? null,
              senderProfile,
            });
          }
        }

        // Sort all inquiries by created_at descending (since we may have merged multiple chunks)
        allInquiries.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setInquiries(allInquiries);
      } catch {
        toast.error("Failed to fetch inquiries");
      }
      setLoading(false);
    };

    fetchInquiries();
  }, [user, authLoading]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Inquiries</h1>

      {inquiries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              No inquiries yet
            </p>
            <p className="text-sm text-muted-foreground">
              Inquiries on your listings will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="rounded-2xl border-zinc-200/80 dark:border-zinc-800/80 shadow-3d bg-white dark:bg-zinc-900/80">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">
                    {inquiry.listing ? (
                      <Link
                        href={`/listing/${inquiry.listing.id}`}
                        className="flex items-center gap-1 hover:underline"
                      >
                        {inquiry.listing.title}
                        <ExternalLink className="size-3" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        Listing unavailable
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    {new Date(inquiry.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {inquiry.senderProfile?.full_name ?? "Unknown User"}
                  </Badge>
                  {(inquiry.phone || inquiry.senderProfile?.phone) && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="size-3" />
                      {inquiry.phone || inquiry.senderProfile?.phone}
                    </span>
                  )}
                </div>
                <p className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3.5 text-sm border border-zinc-100 dark:border-zinc-800/80">
                  {inquiry.message}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
