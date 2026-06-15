import type { Listing } from "@/lib/types/database";

export interface TimerDuration {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const DEFAULT_TIMER_DURATION: TimerDuration = {
  months: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

export const LISTING_FEE = 250;

export function sanitizeTimerDuration(
  duration?: Partial<TimerDuration> | null
): TimerDuration {
  return {
    months: Math.max(0, Math.floor(Number(duration?.months ?? 0) || 0)),
    days: Math.max(0, Math.floor(Number(duration?.days ?? 0) || 0)),
    hours: Math.max(0, Math.floor(Number(duration?.hours ?? 0) || 0)),
    minutes: Math.max(0, Math.floor(Number(duration?.minutes ?? 0) || 0)),
    seconds: Math.max(0, Math.floor(Number(duration?.seconds ?? 0) || 0)),
  };
}

export function hasTimerDuration(duration?: Partial<TimerDuration> | null) {
  const sanitized = sanitizeTimerDuration(duration);
  return (
    sanitized.months > 0 ||
    sanitized.days > 0 ||
    sanitized.hours > 0 ||
    sanitized.minutes > 0 ||
    sanitized.seconds > 0
  );
}

export function addTimerDuration(
  startDate: Date,
  duration?: Partial<TimerDuration> | null
) {
  const sanitized = sanitizeTimerDuration(duration);
  const result = new Date(startDate);

  result.setMonth(result.getMonth() + sanitized.months);
  result.setDate(result.getDate() + sanitized.days);
  result.setHours(result.getHours() + sanitized.hours);
  result.setMinutes(result.getMinutes() + sanitized.minutes);
  result.setSeconds(result.getSeconds() + sanitized.seconds);

  return result;
}

export function getEffectiveListingStatus(listing: Listing) {
  if (
    listing.status === "active" &&
    listing.expires_at &&
    new Date(listing.expires_at).getTime() <= Date.now()
  ) {
    return "timed_out" as const;
  }

  return listing.status;
}

export function isListingPubliclyVisible(listing: Listing) {
  return getEffectiveListingStatus(listing) === "active";
}

/**
 * Returns the number of milliseconds remaining until the listing expires.
 * Returns null if no expiry is set.
 * Returns 0 (never negative) if the listing has already expired.
 * Handles: ISO string, Firestore Timestamp object (seconds/nanoseconds),
 * and Firestore Timestamp objects with toMillis() or toDate() methods.
 */
export function getRemainingTimeMs(
  expiresAt?:
    | string
    | {
        seconds: number;
        nanoseconds?: number;
        toMillis?: () => number;
        toDate?: () => Date;
      }
    | null
): number | null {
  if (!expiresAt) return null;

  let expireTime: number;

  if (typeof expiresAt === "object") {
    // Firestore Timestamp with toMillis()
    if (typeof (expiresAt as any).toMillis === "function") {
      expireTime = (expiresAt as any).toMillis();
    }
    // Firestore Timestamp with toDate()
    else if (typeof (expiresAt as any).toDate === "function") {
      expireTime = (expiresAt as any).toDate().getTime();
    }
    // Plain object { seconds, nanoseconds }
    else if ("seconds" in expiresAt) {
      const nanoseconds = (expiresAt as any).nanoseconds ?? 0;
      expireTime =
        expiresAt.seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
    } else {
      return null;
    }
  } else {
    expireTime = new Date(expiresAt).getTime();
  }

  if (isNaN(expireTime) || !isFinite(expireTime)) return null;

  // Always clamp to 0 — never return negative milliseconds
  return Math.max(0, expireTime - Date.now());
}

export function formatRemainingDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const months = Math.floor(totalSeconds / (30 * 86400));
  const afterMonths = totalSeconds % (30 * 86400);
  const days = Math.floor(afterMonths / 86400);
  const hours = Math.floor((afterMonths % 86400) / 3600);
  const minutes = Math.floor((afterMonths % 3600) / 60);
  const seconds = afterMonths % 60;
  const parts = [
    months > 0 ? `${months}mo` : null,
    months > 0 || days > 0 ? `${days}d` : null,
    months > 0 || days > 0 || hours > 0 ? `${hours}h` : null,
    months > 0 || days > 0 || hours > 0 || minutes > 0 ? `${minutes}m` : null,
    `${seconds}s`,
  ].filter(Boolean);

  return parts.join(" ");
}

export function formatTimerDuration(duration?: Partial<TimerDuration> | null) {
  const sanitized = sanitizeTimerDuration(duration);
  const parts = [
    sanitized.months > 0
      ? `${sanitized.months} month${sanitized.months === 1 ? "" : "s"}`
      : null,
    sanitized.days > 0
      ? `${sanitized.days} day${sanitized.days === 1 ? "" : "s"}`
      : null,
    sanitized.hours > 0
      ? `${sanitized.hours} hr${sanitized.hours === 1 ? "" : "s"}`
      : null,
    sanitized.minutes > 0
      ? `${sanitized.minutes} min${sanitized.minutes === 1 ? "" : "s"}`
      : null,
    sanitized.seconds > 0
      ? `${sanitized.seconds} sec${sanitized.seconds === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "No timer set";
}
