"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: string;
  role: string;
  creditBalance: number;
  dailyUsageCount: number;
  createdAt: string;
}

interface UserStats {
  totalMessages: number;
  totalTokens: number;
  totalConversations: number;
  avgMessagesPerDay: number;
  lastActive: string | null;
  firstActive: string | null;
}

interface ChartPoint {
  date: string;
  count: number;
}

interface HourPoint {
  hour: number;
  count: number;
}

interface WeekdayPoint {
  day: number;
  count: number;
}

interface ConversationRow {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: string | null;
}

interface TransactionRow {
  id: string;
  type: string;
  credits: number | null;
  amountBrl: number | null;
  status: string;
  createdAt: string;
}

interface UserDetailData {
  user: UserProfile;
  stats: UserStats;
  charts: {
    messagesPerDay: ChartPoint[];
    messagesByHour: HourPoint[];
    messagesByWeekday: WeekdayPoint[];
  };
  recentConversations: ConversationRow[];
  transactions: TransactionRow[];
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const planBadgeColors: Record<string, string> = {
  free: "bg-zinc-700 text-zinc-300",
  credits: "bg-indigo-900 text-indigo-300",
  unlimited: "bg-emerald-900 text-emerald-300",
};

const statusColors: Record<string, string> = {
  completed: "text-emerald-400",
  pending: "text-amber-400",
  failed: "text-red-400",
  refunded: "text-zinc-400",
};

const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  fontSize: "12px",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR");
}

function formatChartDate(dateStr: string | number) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}h`;
}

function timeSince(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  const months = Math.floor(days / 30);
  return `${months}m atrás`;
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<UserDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar dados do usuário");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted animate-pulse">Carregando...</p>
      </div>
    );
  }

  const { user, stats, charts, recentConversations, transactions } = data;

  // Fill all 24 hours for the hour chart
  const hourData = Array.from({ length: 24 }, (_, i) => {
    const found = charts.messagesByHour.find((h) => h.hour === i);
    return { hour: i, count: found?.count ?? 0 };
  });

  // Fill all 7 weekdays
  const weekdayData = Array.from({ length: 7 }, (_, i) => {
    const found = charts.messagesByWeekday.find((d) => d.day === i);
    return { day: WEEKDAY_LABELS[i], count: found?.count ?? 0 };
  });

  return (
    <div className="space-y-8">
      {/* Back link + Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="flex items-center gap-4">
          {user.image && (
            <img
              src={user.image}
              alt=""
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">
              {user.name ?? user.email}
            </h2>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span
              className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${planBadgeColors[user.plan] ?? "bg-zinc-800 text-zinc-400"}`}
            >
              {user.plan}
            </span>
            {user.role === "admin" && (
              <span className="inline-block px-2.5 py-1 rounded text-xs font-medium bg-amber-900 text-amber-300">
                admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Mensagens" value={stats.totalMessages} />
        <StatCard label="Conversas" value={stats.totalConversations} />
        <StatCard label="Tokens usados" value={stats.totalTokens.toLocaleString("pt-BR")} />
        <StatCard label="Média msg/dia" value={stats.avgMessagesPerDay} />
        <StatCard label="Créditos" value={user.creditBalance} />
        <StatCard
          label="Último uso"
          value={stats.lastActive ? timeSince(stats.lastActive) : "—"}
        />
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-muted text-xs">Membro desde</p>
          <p>{formatDate(user.createdAt)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-muted text-xs">Primeira mensagem</p>
          <p>{stats.firstActive ? formatDate(stats.firstActive) : "—"}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-muted text-xs">Uso diário (hoje)</p>
          <p>{user.dailyUsageCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-muted text-xs">Última atividade</p>
          <p>{stats.lastActive ? formatDateTime(stats.lastActive) : "—"}</p>
        </div>
      </div>

      {/* Activity chart — Messages per day */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-medium text-muted mb-4">
          Atividade diária (últimos 30 dias)
        </h3>
        {charts.messagesPerDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={charts.messagesPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                stroke="#71717a"
                fontSize={12}
              />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(label) => formatChartDate(String(label))}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
                name="Mensagens"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted text-sm text-center py-8">
            Sem atividade nos últimos 30 dias
          </p>
        )}
      </div>

      {/* Behavior charts — Hour + Weekday */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted mb-4">
            Horário de uso (90 dias)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="hour"
                tickFormatter={formatHour}
                stroke="#71717a"
                fontSize={11}
                interval={2}
              />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(h) => `${formatHour(Number(h))}`}
              />
              <Bar
                dataKey="count"
                fill="#818cf8"
                radius={[2, 2, 0, 0]}
                name="Mensagens"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted mb-4">
            Dia da semana (90 dias)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="count"
                fill="#a78bfa"
                radius={[2, 2, 0, 0]}
                name="Mensagens"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent conversations */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium">
            Conversas recentes ({recentConversations.length})
          </h3>
        </div>
        {recentConversations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-left">
                  <th className="px-6 py-3 font-medium">Título</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Mensagens
                  </th>
                  <th className="px-6 py-3 font-medium">Última msg</th>
                  <th className="px-6 py-3 font-medium">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {recentConversations.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-card-hover transition-colors"
                  >
                    <td className="px-6 py-3 max-w-xs truncate">{c.title}</td>
                    <td className="px-6 py-3 text-right">{c.messageCount}</td>
                    <td className="px-6 py-3 text-muted">
                      {c.lastMessageAt ? timeSince(c.lastMessageAt) : "—"}
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted text-sm text-center py-8">
            Nenhuma conversa
          </p>
        )}
      </div>

      {/* Transactions */}
      {transactions.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-medium">
              Transações ({transactions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-left">
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium text-right">
                    Créditos
                  </th>
                  <th className="px-6 py-3 font-medium text-right">Valor</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border hover:bg-card-hover transition-colors"
                  >
                    <td className="px-6 py-3">{t.type}</td>
                    <td className="px-6 py-3 text-right">
                      {t.credits ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {t.amountBrl ? formatCurrency(t.amountBrl) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={statusColors[t.status] ?? "text-muted"}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
    </div>
  );
}
