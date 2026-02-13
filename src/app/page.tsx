import Link from "next/link";
import { MessageSquare, CreditCard, Infinity } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Selene</h1>
        <Link
          href="/login"
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Entrar
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">
            Seu assistente IA,{" "}
            <span className="text-primary">sempre disponivel</span>
          </h2>
          <p className="text-lg text-muted">
            Converse com inteligencia artificial de ultima geracao.
            Comece gratis com 20 mensagens por dia.
          </p>

          <Link
            href="/login"
            className="inline-block bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            Comecar agora — e gratis
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full">
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h3 className="font-semibold text-lg">Gratuito</h3>
            <p className="text-muted text-sm">
              20 mensagens por dia. Sem cartao de credito.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <CreditCard className="w-8 h-8 text-primary" />
            <h3 className="font-semibold text-lg">Creditos</h3>
            <p className="text-muted text-sm">
              Compre creditos e use no seu ritmo. PIX, cartao ou boleto.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <Infinity className="w-8 h-8 text-primary" />
            <h3 className="font-semibold text-lg">Ilimitado</h3>
            <p className="text-muted text-sm">
              R$ 49,90/mes. Uso ilimitado sem preocupacoes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
