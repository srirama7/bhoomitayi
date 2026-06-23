import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, getAuth, browserPopupRedirectResolver } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const sanitize = (val?: string) => {
  if (!val) return "";
  return val.trim().replace(/%0D/gi, '').replace(/%0A/gi, '').replace(/[\r\n]+/g, '');
};

const fallbackFirebaseConfig = {
  apiKey: "AIzaSyBwCGZRm_2z2o1CWLfDzKSni58PyL3angY",
  authDomain: "real-estate-4a9f1.firebaseapp.com",
  projectId: "real-estate-4a9f1",
  storageBucket: "real-estate-4a9f1.firebasestorage.app",
  messagingSenderId: "128735139971",
  appId: "1:128735139971:web:62d74234071e656e3023b6",
  measurementId: "G-KWHSMHYCGW",
};

const firebaseConfig = {
  apiKey: sanitize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || fallbackFirebaseConfig.apiKey,
  authDomain: sanitize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || fallbackFirebaseConfig.authDomain,
  projectId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || fallbackFirebaseConfig.projectId,
  storageBucket: sanitize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || fallbackFirebaseConfig.storageBucket,
  messagingSenderId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || fallbackFirebaseConfig.messagingSenderId,
  appId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || fallbackFirebaseConfig.appId,
  measurementId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || fallbackFirebaseConfig.measurementId,
};

// Defensive: Only initialize if we have a valid-looking config
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;

const app = getApps().length === 0 
  ? (isConfigValid ? initializeApp(firebaseConfig) : null)
  : getApps()[0];

// Use initializeAuth with IndexedDB + localStorage persistence.
// This avoids sessionStorage entirely, which fixes the
// "missing initial state" error in Android WebView (Capacitor APK).
// DO NOT use getAuth() here — it uses sessionStorage for redirect state
// which is inaccessible in partitioned WebView environments.
export const auth = app
  ? (() => {
      try {
        // Try initializeAuth first (new instance)
        // Only use browserPopupRedirectResolver in browser (not during SSR)
        return initializeAuth(app, {
          persistence: [indexedDBLocalPersistence, browserLocalPersistence],
          popupRedirectResolver: typeof window !== "undefined" ? browserPopupRedirectResolver : undefined,
        });
      } catch {
        // Already initialized — get existing instance
        return getAuth(app);
      }
    })()
  : null as any;
export const db = app ? getFirestore(app) : null as any;
export const storage = app ? getStorage(app) : null as any;

let analytics = null;
if (app && typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}
export { analytics };

export default app;
