"use server";

import { cookies } from "next/headers";

export async function setLanguageAction(lang: string) {
  const value = lang === "en" ? "en" : "id";
  (await cookies()).set("lang", value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
