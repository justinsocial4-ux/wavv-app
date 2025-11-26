"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export function NewProjectForm() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("In progress");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const { error } = await supabase.from("projects").insert({
      name: name.trim(),
      status,
      // updated_at will default to now() in the DB
    });

    if (error) {
      console.error("Error creating project:", error);
      setError(error.message);
      setIsSubmitting(false);
      return;
    }

    // Clear form
    setName("");
    setStatus("In progress");
    setIsSubmitting(false);

    // Ask Next.js to re-run the server component and fetch fresh data
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option>In progress</option>
          <option>Draft</option>
          <option>Ready</option>
        </select>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Creating..." : "Create project"}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-300">
          Error creating project: {error}
        </p>
      )}
    </div>
  );
}
