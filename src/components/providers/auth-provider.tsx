"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAuthStore } from "@/lib/store";
import { DEFAULT_FREE_TOKENS } from "@/lib/constants";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    if (!auth) {
      console.error("Firebase Auth is not initialized. Check your environment variables.");
      setLoading(false);
      return;
    }

    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (user && db) {
        const profileRef = doc(db, "profiles", user.uid);
        profileUnsub = onSnapshot(profileRef, async (profileSnap) => {
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            let tokens = data.tokens;
            const unlockedListings = data.unlocked_listings || [];

            if (tokens === undefined || tokens === null) {
              tokens = DEFAULT_FREE_TOKENS;
            }

            setProfile({
              id: profileSnap.id,
              ...data,
              tokens: tokens ?? DEFAULT_FREE_TOKENS,
              unlocked_listings: unlockedListings,
            } as import("@/lib/types/database").Profile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile snapshot error:", err);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      if (profileUnsub) profileUnsub();
      unsubscribe();
    };
  }, [setUser, setProfile, setLoading]);

  return <>{children}</>;
}
