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
