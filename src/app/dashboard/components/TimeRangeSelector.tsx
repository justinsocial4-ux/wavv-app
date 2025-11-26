// src/app/dashboard/components/TimeRangeSelector.tsx
"use client";

import { useState } from "react";
import { TimeRangeKey, FIXED_TIME_RANGES } from "../metrics";

interface TimeRangeSelectorProps {
  timeRange: TimeRangeKey;
  setTimeRange: (value: TimeRangeKey) => void;
  customDays: number | null;
  setCustomDays: (value: number | null) => void;
}

export function TimeRangeSelector({
  timeRange,
  setTimeRange,
  customDays,
  setCustomDays,
}: TimeRangeSelectorProps) {
  const [customAmount, setCustomAmount] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<"days" | "weeks" | "months">(
    "days"
  );

  function handleApplyCustomRange() {
    const amountNum = Number(customAmount);
    if (!amountNum || amountNum <= 0) return;

    let days = amountNum;
    if (customUnit === "weeks") days = amountNum * 7;
    if (customUnit === "months") days = amountNum * 30;

    setCustomDays(days);
    setTimeRange("custom");
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-gray-500">
          Time range
        </span>
        {FIXED_TIME_RANGES.map((range) => (
          <button
            key={range.key}
            onClick={() => setTimeRange(range.key)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              timeRange === range.key
                ? "border-white bg-white/10 text-white"
                : "border-gray-700 text-gray-300 hover:border-gray-400"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-gray-500">
        All tiles, charts, and insights below are filtered to this time range.
      </p>

      {/* Custom range */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
        <span className="uppercase tracking-wide text-gray-500">
          Custom
        </span>
        <input
          type="number"
          min={1}
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-20 rounded-md border border-gray-700 bg-black px-2 py-1 text-xs text-white outline-none focus:border-gray-400"
          placeholder="Amount"
        />
        <select
          value={customUnit}
          onChange={(e) =>
            setCustomUnit(
              e.target.value as "days" | "weeks" | "months"
            )
          }
          className="rounded-md border border-gray-700 bg-black px-2 py-1 text-xs text-white outline-none focus:border-gray-400"
        >
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
        <button
          onClick={handleApplyCustomRange}
          className={`rounded-md border px-3 py-1 text-xs transition ${
            timeRange === "custom"
              ? "border-white bg-white/10 text-white"
              : "border-gray-700 text-gray-300 hover:border-gray-400"
          }`}
        >
          Apply
        </button>
        {timeRange === "custom" && customDays != null && (
          <span className="text-[11px] text-gray-500">
            Showing last {customDays} days (approx)
          </span>
        )}
      </div>
    </div>
  );
}
