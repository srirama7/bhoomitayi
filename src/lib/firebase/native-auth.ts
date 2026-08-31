"use client";

import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as signOutFromFirebase,
  type UserCredential,
} from "firebase/auth";

import { auth } from "@/lib/firebase/config";

export function isNativeApp(): boolean {
  try {
    if (typeof window === "undefined") return false;
    // Check if running inside a Capacitor native app
    if (Capacitor.isNativePlatform()) return true;
    // Check for the Android bridge object injected by MainActivity
    if ((window as any).AndroidBridge) return true;
    return false;
  } catch {
    return false;
  }
}

export async function signInWithNativeGoogle(): Promise<UserCredential> {
  if (!auth) {
    throw new Error("Authentication service not available.");
  }

  // If running in native Android app, use the AndroidBridge
  // which calls native Google Sign-in and posts back an idToken
  if (isNativeApp() && (window as any).AndroidBridge?.startGoogleSignIn) {
    return new Promise<UserCredential>((resolve, reject) => {
      let isSettled = false;

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        window.removeEventListener("message", messageHandler);
        try {
          delete (window as any).__onGoogleSignInResult;
        } catch {}
      };

      const handleResult = async (idToken: string | null, error: string | null) => {
        if (isSettled) return;
        isSettled = true;
        cleanup();

        if (error) {
          reject(new Error(error));
          return;
        }

        if (!idToken) {
          reject(new Error("No ID token received from native sign-in."));
          return;
        }

        try {
          const credential = GoogleAuthProvider.credential(idToken);
          const result = await signInWithCredential(auth!, credential);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      // Set a timeout in case native sign-in hangs
      const timeout = setTimeout(() => {
        handleResult(null, "Native Google sign-in timed out. Please try again.");
      }, 60000);

      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type !== "GOOGLE_SIGN_IN_RESULT") return;
        handleResult(event.data.idToken || null, event.data.error || null);
      };

      // Direct callback function for Android WebView
      (window as any).__onGoogleSignInResult = (idToken: string | null, error: string | null) => {
        handleResult(idToken, error);
      };

      window.addEventListener("message", messageHandler);

      // Tell Android to start Google Sign-in
      try {
        (window as any).AndroidBridge.startGoogleSignIn();
      } catch (bridgeErr: any) {
        handleResult(null, bridgeErr?.message || "Failed to start Google sign-in");
      }
    });
  }

  // Not in native app — throw so caller can fall back to web popup
  throw new Error("Native Google sign-in is only available in the Android app.");
}

export async function signOutEverywhere() {
  if (auth) {
    await signOutFromFirebase(auth);
  }
}

export function getListingUrl(id: string): string {
  if (isNativeApp()) {
    return `/listing/1?id=${id}`;
  }
  return `/listing/${id}`;
}

