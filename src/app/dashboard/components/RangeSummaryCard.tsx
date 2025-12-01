// src/app/dashboard/components/RangeSummaryCard.tsx
"use client";

type RangeSummaryCardProps = {
  aiSummaryMain: string;
  cadenceSentence: string;
  hashtagSentence: string;
};

export function RangeSummaryCard({
  aiSummaryMain,
  cadenceSentence,
  hashtagSentence,
}: RangeSummaryCardProps) {
  return (
    <section className="mb-6">
      <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 px-5 py-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          Wavv read on this range
        </p>

        <p className="mt-2 text-sm text-gray-100">{aiSummaryMain}</p>

        <p className="mt-1 text-xs text-gray-400">
          <span className="font-semibold">Cadence: </span>
          {cadenceSentence}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          <span className="font-semibold">Hashtags: </span>
          {hashtagSentence}
        </p>
      </div>
    </section>
  );
}
