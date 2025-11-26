"use client";

import type { DailyPoint } from "@/app/dashboard/metrics";

type Props = {
  dailyPoints: DailyPoint[];
  leftLabel: string;
  rightLabel: string;
};

export function PerformanceTrendChart({
  dailyPoints,
  leftLabel,
  rightLabel,
}: Props) {
  // No data state
  if (!dailyPoints || dailyPoints.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-4">
        <h2 className="mb-2 text-lg font-medium">Performance trend</h2>
        <p className="text-xs text-gray-500">
          No data in this time range.
        </p>
      </div>
    );
  }

  // Build a simple sparkline-style SVG
  const width = 360;
  const height = 120;
  const maxPlays = Math.max(...dailyPoints.map((p) => p.totalPlays), 0);
  const safeMax = maxPlays || 1;
  const stepX = dailyPoints.length > 1 ? width / (dailyPoints.length - 1) : 0;

  const pointsAttr = dailyPoints
    .map((p, idx) => {
      const x = idx * stepX;
      const y = height - (p.totalPlays / safeMax) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const totalPlays = dailyPoints.reduce(
    (sum, p) => sum + p.totalPlays,
    0
  );
  const totalVideos = dailyPoints.reduce(
    (sum, p) => sum + p.videoCount,
    0
  );
  const avgPlaysPerDay =
    dailyPoints.length > 0 ? totalPlays / dailyPoints.length : 0;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Performance trend</h2>
          <p className="text-[11px] text-gray-500">
            Total plays for videos posted in this time range.
          </p>
        </div>
        <div className="text-right text-[11px] text-gray-500">
          <div>
            Plays:{" "}
            <span className="font-semibold text-gray-100">
              {totalPlays.toLocaleString()}
            </span>
          </div>
          <div>
            Videos:{" "}
            <span className="font-semibold text-gray-100">
              {totalVideos}
            </span>
          </div>
          <div>
            Avg plays / day:{" "}
            <span className="font-semibold text-gray-100">
              {Math.round(avgPlaysPerDay).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>

      <div className="rounded-xl border border-gray-800 bg-black/40 px-3 py-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-32 w-full"
          preserveAspectRatio="none"
        >
          {/* Background grid-ish line */}
          <line
            x1={0}
            y1={height - 0.5}
            x2={width}
            y2={height - 0.5}
            stroke="rgba(148,163,184,0.3)"
            strokeWidth={0.5}
          />

          {/* Area fill */}
          <polyline
            points={`0,${height} ${pointsAttr} ${width},${height}`}
            fill="rgba(59,130,246,0.12)"
            stroke="none"
          />

          {/* Line */}
          <polyline
            points={pointsAttr}
            fill="none"
            stroke="rgba(96,165,250,1)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
