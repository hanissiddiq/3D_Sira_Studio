"use client";

import { createContext, useContext } from "react";
import { dictionaries, type Lang } from "@/lib/i18n/dictionaries";

const LangContext = createContext<Lang>("id");

export function LanguageProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}
export const useLang = () => useContext(LangContext);
export const useDict = () => dictionaries[useContext(LangContext)];
