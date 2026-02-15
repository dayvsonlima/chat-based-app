import Link from "next/link";

export function BlogCTA() {
  return (
    <div className="not-prose my-8 rounded-xl border border-border bg-card p-6 text-center">
      <h3 className="text-xl font-semibold mb-2">
        Experimente o Selene gratuitamente
      </h3>
      <p className="text-muted mb-4">
        20 mensagens por dia, sem cartao de credito. Crie sua conta em segundos.
      </p>
      <Link
        href="/login"
        className="inline-block bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Comecar agora — e gratis
      </Link>
    </div>
  );
}
