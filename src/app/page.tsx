"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const DASHBOARD_USERNAME = "bigdealjfk";

type IngestRun = {
  id: string;
  created_at: string;
  username: string;
  source: string | null;
  success: boolean;
  posts_fetched: number | null;
  duration_ms: number | null;
  error_message: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StatusPage() {
  const [postCount, setPostCount] = useState<number | null>(null);
  const [latestPostCreatedAt, setLatestPostCreatedAt] = useState<string | null>(
    null
  );
  const [latestRun, setLatestRun] = useState<IngestRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      setLoading(true);

      // 1) How many TikTok posts are stored for this user?
      const {
        count,
        error: countError,
      } = await supabase
        .from("tiktok_posts")
        .select("*", { count: "exact", head: true })
        .eq("username", DASHBOARD_USERNAME);

      if (!countError) {
        setPostCount(count ?? 0);
      } else {
        console.error("Error counting posts:", countError);
        setPostCount(null);
      }

      // 2) Latest TikTok-created timestamp we know about
      const { data: latestPostRows, error: latestPostError } = await supabase
        .from("tiktok_posts")
        .select("created_at")
        .eq("username", DASHBOARD_USERNAME)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!latestPostError && latestPostRows && latestPostRows.length > 0) {
        setLatestPostCreatedAt(latestPostRows[0].created_at);
      } else {
        setLatestPostCreatedAt(null);
      }

      // 3) Latest ingest run from the new log table
      const { data: runRows, error: runError } = await supabase
        .from("tiktok_ingest_runs")
        .select("*")
        .eq("username", DASHBOARD_USERNAME)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!runError && runRows && runRows.length > 0) {
        setLatestRun(runRows[0] as IngestRun);
      } else {
        setLatestRun(null);
      }

      setLoading(false);
    }

    loadStatus();
  }, []);

  const overallHealthy =
    (postCount ?? 0) > 0 &&
    latestRun != null &&
    latestRun.success === true;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Wavv Status
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Quick health check for Wavv&apos;s TikTok data pipeline.
          </p>
        </div>

        {/* Overall health card */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Overall health
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                overallHealthy ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="font-medium">
              {loading
                ? "Checking systems…"
                : overallHealthy
                ? "All systems look healthy."
                : "Wavv is connected, but the ingest history needs attention."}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Wavv looks at how many posts are in Supabase, when the last one was
            ingested, and whether the latest ingest run succeeded.
          </p>
        </section>

        {/* Metric cards */}
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {/* TikTok posts in Supabase */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              TikTok posts in Supabase
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {loading ? "…" : postCount ?? "—"}
            </p>
          </div>

          {/* Latest post ingested */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Latest post ingested
            </p>
            <p className="mt-2 text-sm">
              {loading ? "…" : formatDateTime(latestPostCreatedAt)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Based on the latest TikTok-created timestamp we&apos;ve stored.
            </p>
          </div>

          {/* Latest ingest run */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Latest ingest run
            </p>
            <p className="mt-2 text-sm">
              {loading
                ? "…"
                : latestRun
                ? formatDateTime(latestRun.created_at)
                : "No ingest runs logged yet."}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {latestRun
                ? latestRun.success
                  ? `Last run succeeded · ${
                      latestRun.posts_fetched ?? 0
                    } posts touched in ${latestRun.duration_ms ?? 0} ms.`
                  : `Last run failed${
                      latestRun.error_message
                        ? ` · ${latestRun.error_message}`
                        : ""
                    }`
                : "Once you refresh TikTok data, Wavv will start logging run history here."}
            </p>
          </div>
        </section>

        <p className="text-xs text-slate-500">
          Next step: we&apos;ll log each ingest attempt separately so you can see
          detailed run history and errors here.
        </p>
      </div>
    </main>
  );
}
