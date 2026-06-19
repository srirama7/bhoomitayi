"use client";

import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut as signOutFromFirebase,
  type UserCredential,
} from "firebase/auth";

import { auth } from "@/lib/firebase/config";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function signInWithNativeGoogle(): Promise<UserCredential> {
  if (!auth) {
    throw new Error("Authentication service not available.");
  }

  const result = await FirebaseAuthentication.signInWithGoogle({
    skipNativeAuth: true,
  });

  const idToken = result.credential?.idToken;
  const accessToken = result.credential?.accessToken;

  if (!idToken) {
    throw new Error("Native Google sign-in did not return an ID token.");
  }

  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  return signInWithCredential(auth, credential);
}

export async function signOutEverywhere() {
  if (isNativeApp()) {
    try {
      await FirebaseAuthentication.signOut();
    } catch (error) {
      console.warn("Native sign-out failed:", error);
    }
  }

  if (auth) {
    await signOutFromFirebase(auth);
  }
}
