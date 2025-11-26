"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type DeleteProjectButtonProps = {
  id: number;
};

export function DeleteProjectButton({ id }: DeleteProjectButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    // Debug: confirm the click handler is wired up
    console.log("Delete clicked for project id:", id);

    const confirmed = window.confirm("Delete this project?");
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting project:", error);
      setError(error.message);
      setIsDeleting(false);
      return;
    }

    // Re-fetch server data and update the dashboard list + stats
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50 transition"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <span className="text-[10px] text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
