import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const sanitize = (val?: string) => {
  if (!val) return "";
  return val.trim().replace(/%0D/gi, '').replace(/%0A/gi, '').replace(/[\r\n]+/g, '');
};

const firebaseConfig = {
  apiKey: sanitize(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: sanitize(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: sanitize(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: sanitize(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
};

// Defensive: Only initialize if we have a valid-looking config
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10;

const app = getApps().length === 0 
  ? (isConfigValid ? initializeApp(firebaseConfig) : null)
  : getApps()[0];

export const auth = app ? getAuth(app) : null as any;
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
