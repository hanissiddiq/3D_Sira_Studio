// MENGGANTIKAN layout.tsx bawaan create-next-app (tema + bahasa dipasang di root agar berlaku di admin juga).
import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/layout/LanguageProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "Sira Studio", template: "%s · Sira Studio" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <ThemeProvider>
          <LanguageProvider lang={lang}>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
