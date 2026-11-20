import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Login Admin" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const initialError =
    error === "forbidden" ? "Anda tidak memiliki izin untuk halaman tersebut." : undefined;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sira Studio</CardTitle>
          <CardDescription>Masuk untuk Admin &amp; Operator</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={next} initialError={initialError} />
        </CardContent>
      </Card>
    </main>
  );
}
