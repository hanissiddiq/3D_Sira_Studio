"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setLanguageAction } from "@/app/actions/language";
import { useDict, useLang } from "./LanguageProvider";

export function LanguageToggle() {
  const lang = useLang();
  const t = useDict().lang;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = lang === "id" ? "en" : "id";
  return (
    <Button variant="ghost" size="sm" disabled={pending} aria-label={t[next]} title={t[next]}
      onClick={() => startTransition(async () => { await setLanguageAction(next); router.refresh(); })}>
      {next.toUpperCase()}
    </Button>
  );
}
