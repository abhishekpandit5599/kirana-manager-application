import { create } from "zustand";

interface LanguageState {
  language: "en" | "hi";
  setLanguage: (lang: "en" | "hi") => void;
  t: (en: string, hi: string) => string;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  language: "en",
  setLanguage: (language) => set({ language }),
  t: (en, hi) => {
    return get().language === "en" ? en : hi;
  },
}));
