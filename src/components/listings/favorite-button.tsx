"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  listingId: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
}

export function FavoriteButton({ listingId, size = "icon", variant = "ghost" }: FavoriteButtonProps) {
  const { user } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteDocId, setFavoriteDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const checkFavorite = async () => {
      const q = query(
        collection(db, "favorites"),
        where("user_id", "==", user.uid),
        where("listing_id", "==", listingId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setIsFavorite(true);
        setFavoriteDocId(snapshot.docs[0].id);
      } else {
        setIsFavorite(false);
        setFavoriteDocId(null);
      }
    };
    checkFavorite();
  }, [user, listingId]);

  const toggle = async () => {
    if (!user) {
      toast.error("Please login to save favorites");
      return;
    }
    setLoading(true);
    try {
      if (isFavorite && favoriteDocId) {
        await deleteDoc(doc(db, "favorites", favoriteDocId));
        setIsFavorite(false);
        setFavoriteDocId(null);
        toast.success("Removed from favorites");
      } else {
        const docRef = await addDoc(collection(db, "favorites"), {
          user_id: user.uid,
          listing_id: listingId,
          created_at: new Date().toISOString(),
        });
        setIsFavorite(true);
        setFavoriteDocId(docRef.id);
        toast.success("Added to favorites");
      }
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} onClick={toggle} disabled={loading}>
      <Heart
        className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")}
      />
    </Button>
  );
}
