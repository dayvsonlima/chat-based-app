import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/chat");
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Selene Admin</h1>
            <Link
              href="/chat"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Voltar ao chat
            </Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </div>
    </SessionProvider>
  );
}
