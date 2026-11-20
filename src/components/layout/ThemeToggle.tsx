"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useDict } from "./LanguageProvider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useDict().theme;
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={t.toggle} title={dark ? t.light : t.dark}>
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
