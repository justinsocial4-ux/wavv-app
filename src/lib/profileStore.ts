import { create } from "zustand";

export type ProfileStore = {
  activeProfileId: string | null;
  setActiveProfileId: (id: string) => void;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  activeProfileId: null,
  setActiveProfileId: (id: string) => {
    set({ activeProfileId: id });
  },
}));
