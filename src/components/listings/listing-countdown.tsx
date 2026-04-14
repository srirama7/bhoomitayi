"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getRemainingTimeMs,
  LISTING_FEE,
} from "@/lib/listing-timer";

interface ListingCountdownProps {
  expiresAt?: string | null;
  status: string;
  onReactivate?: () => void;
  reactivating?: boolean;
  showRestartButton?: boolean;
}

interface TimeLeft {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function computeTimeLeft(ms: number): TimeLeft {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const months = Math.floor(totalSec / (30 * 86400));
  const afterMonths = totalSec % (30 * 86400);
  const days = Math.floor(afterMonths / 86400);
  const hours = Math.floor((afterMonths % 86400) / 3600);
  const minutes = Math.floor((afterMonths % 3600) / 60);
  const seconds = afterMonths % 60;
  return { months, days, hours, minutes, seconds };
}

export function ListingCountdown({
  expiresAt,
  status,
  onReactivate,
  reactivating = false,
  showRestartButton = false,
}: ListingCountdownProps) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = getRemainingTimeMs(expiresAt);
  const isTimedOut =
    status === "timed_out" ||
    (status === "active" && remainingMs !== null && remainingMs === 0);

  if (isTimedOut) {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 dark:border-red-800 dark:from-red-950/30 dark:to-orange-950/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-700 dark:text-red-300">
              Listing Timed Out
            </h3>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">
              This listing is no longer visible to the public.
            </p>
          </div>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300 mb-3">
          Only admin can restart this listing. Pay ₹{LISTING_FEE} to submit a
          restart request for admin approval.
        </p>
        {showRestartButton && onReactivate && (
          <Button
            size="sm"
            onClick={onReactivate}
            disabled={reactivating}
            className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700"
          >
            {reactivating ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Restart for ₹{LISTING_FEE}
          </Button>
        )}
      </div>
    );
  }

  if (remainingMs === null || status !== "active") {
    return null;
  }

  const timeLeft = computeTimeLeft(remainingMs);

  const isUrgent = remainingMs < 3600000; // less than 1 hour

  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        isUrgent
          ? "border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-700 dark:from-amber-950/30 dark:to-orange-950/20"
          : "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/20"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock
          className={`size-4 ${
            isUrgent
              ? "text-amber-600 dark:text-amber-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
        />
        <span
          className={`text-sm font-semibold ${
            isUrgent
              ? "text-amber-700 dark:text-amber-300"
              : "text-blue-700 dark:text-blue-300"
          }`}
        >
          {isUrgent ? "Expires Soon!" : "Time Remaining"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        <CountdownUnit
          value={timeLeft.months}
          label="Months"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.days}
          label="Days"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.hours}
          label="Hrs"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.minutes}
          label="Mins"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.seconds}
          label="Sec"
          isUrgent={isUrgent}
        />
      </div>
      <p
        className={`mt-2 text-center text-xs ${
          isUrgent
            ? "text-amber-600 dark:text-amber-400"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {timeLeft.months} month{timeLeft.months !== 1 ? "s" : ""} /{" "}
        {timeLeft.days} day{timeLeft.days !== 1 ? "s" : ""} /{" "}
        {timeLeft.hours} hr{timeLeft.hours !== 1 ? "s" : ""} /{" "}
        {timeLeft.minutes} min{timeLeft.minutes !== 1 ? "s" : ""} /{" "}
        {timeLeft.seconds} sec
      </p>
    </div>
  );
}

function CountdownUnit({
  value,
  label,
  isUrgent,
}: {
  value: number;
  label: string;
  isUrgent: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex size-12 items-center justify-center rounded-lg text-lg font-bold tabular-nums sm:size-14 sm:text-xl ${
          isUrgent
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
        }`}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span
        className={`mt-1 text-[10px] font-medium sm:text-xs ${
          isUrgent
            ? "text-amber-600 dark:text-amber-400"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}