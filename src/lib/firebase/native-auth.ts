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
      // Set a timeout in case native sign-in hangs
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("Native Google sign-in timed out."));
      }, 60000);

      const handler = async (event: MessageEvent) => {
        if (event.data?.type !== "GOOGLE_SIGN_IN_RESULT") return;

        clearTimeout(timeout);
        window.removeEventListener("message", handler);

        if (event.data.error) {
          reject(new Error(event.data.error));
          return;
        }

        const { idToken, accessToken } = event.data;
        if (!idToken) {
          reject(new Error("No ID token received from native sign-in."));
          return;
        }

        try {
          const credential = GoogleAuthProvider.credential(idToken, accessToken);
          const result = await signInWithCredential(auth!, credential);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      window.addEventListener("message", handler);

      // Tell Android to start Google Sign-in
      (window as any).AndroidBridge.startGoogleSignIn();
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
