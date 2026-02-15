import Link from "next/link";

export function BlogHeader() {
  return (
    <header className="border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold">
          Selene
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/blog" className="text-muted hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="/pricing" className="text-muted hover:text-foreground transition-colors">
            Precos
          </Link>
        </nav>
      </div>
      <Link
        href="/login"
        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Entrar
      </Link>
    </header>
  );
}
