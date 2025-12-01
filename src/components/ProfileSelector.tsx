"use client";

import { useEffect } from "react";
import { useProfileStore } from "@/lib/profileStore";

type CreatorProfile = {
  id: string;
  display_name: string;
  handle: string;
};

export default function ProfileSelector({ profiles }: { profiles: CreatorProfile[] }) {
  const { activeProfileId, setActiveProfileId } = useProfileStore();

  useEffect(() => {
    if (!activeProfileId && profiles.length > 0) {
      setActiveProfileId(profiles[0].id);
    }
  }, [activeProfileId, profiles, setActiveProfileId]);

  if (profiles.length === 0) return null;

  return (
    <select
      className="bg-black border border-gray-700 rounded px-2 py-1 text-sm"
      value={activeProfileId ?? ""}
      onChange={(e) => setActiveProfileId(e.target.value)}
    >
      {profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.display_name}
        </option>
      ))}
    </select>
  );
}
