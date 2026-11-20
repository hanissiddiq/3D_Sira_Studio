import "server-only";
import { cookies } from "next/headers";
import { dictionaries, type Lang } from "./dictionaries";

export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get("lang")?.value;
  return v === "en" ? "en" : "id";
}

export async function getDict() {
  return dictionaries[await getLang()];
}
