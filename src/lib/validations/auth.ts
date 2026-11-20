import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email wajib diisi").email("Format email tidak valid").max(200),
  password: z.string().min(1, "Password wajib diisi").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;
