"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getRemainingTimeMs,
  LISTING_FEE,
  formatTimerDuration,
  type TimerDuration,
} from "@/lib/listing-timer";

interface ListingCountdownProps {
  expiresAt?: string | null;
  status: string;
  onReactivate?: () => void;
  reactivating?: boolean;
  showRestartButton?: boolean;
  timerDuration?: TimerDuration | null;
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
  timerDuration,
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

  if (remainingMs === null && status === "active") {
    return (
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/20">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Awaiting Timer Activation
          </span>
        </div>
        <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-400/80">
          Admin will set the visibility timer shortly.
        </p>
        {timerDuration && (
          <div className="mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/50">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Requested Duration</p>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">{formatTimerDuration(timerDuration)}</p>
          </div>
        )}
      </div>
    );
  }

  if (isTimedOut) {
    return (
      <div className="rounded-xl border-4 border-red-500 bg-red-50 p-6 dark:bg-red-950/20 animate-pulse-subtle">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-red-600 text-white">
            <AlertTriangle className="size-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-red-600 dark:text-red-500 uppercase tracking-tighter">
              TIMED OUT
            </h3>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              Listing Expired & Hidden
            </p>
          </div>
        </div>
        <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-4 bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
          This post has reached its time limit. To reinstall your post, a fee of ₹{LISTING_FEE} is required. Admin will reactivate it after payment confirmation.
        </p>
        {timerDuration && (
          <div className="mb-4 p-3 rounded-lg bg-red-100/50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Last Set Duration</p>
            <p className="text-sm font-bold text-red-800 dark:text-red-200">{formatTimerDuration(timerDuration)}</p>
          </div>
        )}
        {showRestartButton && onReactivate && (
          <Button
            size="lg"
            onClick={onReactivate}
            disabled={reactivating}
            className="w-full gap-2 bg-red-600 text-white hover:bg-red-700 font-bold text-base shadow-lg shadow-red-200 dark:shadow-none py-6"
          >
            {reactivating ? (
              <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RefreshCw className="size-5" />
            )}
            REINSTALL POST (₹{LISTING_FEE})
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
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
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
        {timerDuration && (
          <Badge variant="outline" className={`text-[10px] font-bold ${isUrgent ? "border-amber-200 text-amber-600 bg-amber-50" : "border-blue-200 text-blue-600 bg-blue-50"}`}>
            Total: {formatTimerDuration(timerDuration)}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        <CountdownUnit
          value={timeLeft.months}
          label="MONTH"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.days}
          label="DAY"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.hours}
          label="HR"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.minutes}
          label="MIN"
          isUrgent={isUrgent}
        />
        <CountdownUnit
          value={timeLeft.seconds}
          label="SEC"
          isUrgent={isUrgent}
        />
      </div>
      <p
        className={`mt-2 text-center text-xs font-bold ${
          isUrgent
            ? "text-amber-600 dark:text-amber-400"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        {String(timeLeft.months).padStart(2, "0")} : {String(timeLeft.days).padStart(2, "0")} : {String(timeLeft.hours).padStart(2, "0")} : {String(timeLeft.minutes).padStart(2, "0")} : {String(timeLeft.seconds).padStart(2, "0")}
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