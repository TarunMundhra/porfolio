import { create } from "zustand";

export type Page = "about" | "projects" | "experience" | "contact";

interface NavState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

export const useNavStore = create<NavState>((set) => ({
  currentPage: "about",
  setCurrentPage: (page) => set({ currentPage: page }),
}));
