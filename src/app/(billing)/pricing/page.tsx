"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PLANS } from "@/lib/billing/plans";
import { Check, Zap, CreditCard, Infinity } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  async function handlePurchase(packageId: string) {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoading(packageId);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-3xl font-bold">Escolha seu plano</h1>
          <p className="text-muted">
            Comece gratis. Faca upgrade quando precisar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <div className="space-y-2 mb-6">
              <Zap className="w-8 h-8 text-muted" />
              <h2 className="text-xl font-bold">{PLANS.free.name}</h2>
              <p className="text-3xl font-bold">
                R$ 0 <span className="text-sm font-normal text-muted">/mes</span>
              </p>
              <p className="text-sm text-muted">{PLANS.free.description}</p>
            </div>
            <ul className="space-y-2 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                20 mensagens por dia
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Acesso a IA de ultima geracao
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Historico de conversas
              </li>
            </ul>
            <Link
              href="/chat"
              className="w-full text-center bg-card-hover hover:bg-border border border-border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Comecar gratis
            </Link>
          </div>

          {/* Credits */}
          <div className="bg-card border-2 border-primary rounded-2xl p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
              Mais popular
            </div>
            <div className="space-y-2 mb-6">
              <CreditCard className="w-8 h-8 text-primary" />
              <h2 className="text-xl font-bold">{PLANS.credits.name}</h2>
              <p className="text-3xl font-bold">
                A partir de R$ 9,90
              </p>
              <p className="text-sm text-muted">{PLANS.credits.description}</p>
            </div>
            <ul className="space-y-2 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Sem limite diario
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                PIX, cartao ou boleto
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Creditos nao expiram
              </li>
            </ul>
            <div className="space-y-2">
              {PLANS.credits.packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading === pkg.id}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border",
                    loading === pkg.id
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary-hover",
                    "bg-primary text-white border-primary"
                  )}
                >
                  <span>{pkg.label}</span>
                  <span>{pkg.priceLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Unlimited */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <div className="space-y-2 mb-6">
              <Infinity className="w-8 h-8 text-muted" />
              <h2 className="text-xl font-bold">{PLANS.unlimited.name}</h2>
              <p className="text-3xl font-bold">
                R$ 49,90{" "}
                <span className="text-sm font-normal text-muted">/mes</span>
              </p>
              <p className="text-sm text-muted">{PLANS.unlimited.description}</p>
            </div>
            <ul className="space-y-2 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Mensagens ilimitadas
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Prioridade nas respostas
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-success" />
                Cancele quando quiser
              </li>
            </ul>
            <button
              onClick={() => handlePurchase("unlimited")}
              disabled={loading === "unlimited"}
              className="w-full bg-card-hover hover:bg-border border border-border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading === "unlimited" ? "Processando..." : "Assinar agora"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
