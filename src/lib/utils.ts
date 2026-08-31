import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes an Indian phone number to always include the +91 country code.
 * - Strips all non-digit characters
 * - If the number is 10 digits (e.g. 9876543210), prepends +91
 * - If the number is 12 digits starting with 91 (e.g. 919876543210), prepends +
 * - Otherwise returns the original value unchanged
 */
export function formatPhoneWithCountryCode(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  // Already has +91 or unrecognized format — return as-is
  return phone;
}

/**
 * Recursively cleans objects to remove any `undefined` values so Firestore addDoc/updateDoc never fails.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

