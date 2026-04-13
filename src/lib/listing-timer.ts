import type { Listing } from "@/lib/types/database";

export interface TimerDuration {
  months: number;
  days: number;
  minutes: number;
  seconds: number;
}

export const DEFAULT_TIMER_DURATION: TimerDuration = {
  months: 0,
  days: 0,
  minutes: 0,
  seconds: 0,
};

export const LISTING_FEE = 250;

export function sanitizeTimerDuration(
  duration?: Partial<TimerDuration> | null
): TimerDuration {
  return {
    months: Math.max(0, Number(duration?.months ?? 0)),
    days: Math.max(0, Number(duration?.days ?? 0)),
    minutes: Math.max(0, Number(duration?.minutes ?? 0)),
    seconds: Math.max(0, Number(duration?.seconds ?? 0)),
  };
}

export function hasTimerDuration(duration?: Partial<TimerDuration> | null) {
  const sanitized = sanitizeTimerDuration(duration);
  return (
    sanitized.months > 0 ||
    sanitized.days > 0 ||
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

export function getRemainingTimeMs(expiresAt?: string | null) {
  if (!expiresAt) return null;
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

export function formatRemainingDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const months = Math.floor(totalSeconds / (30 * 86400));
  const afterMonths = totalSeconds % (30 * 86400);
  const days = Math.floor(afterMonths / 86400);
  const hours = Math.floor((afterMonths % 86400) / 3600);
  const minutes = Math.floor((afterMonths % 3600) / 60);
  const seconds = afterMonths % 60;

  if (months > 0) {
    return `${months}mo ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}
