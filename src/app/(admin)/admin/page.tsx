"use client";

import { useState, useEffect, useCallback } from "react";
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

interface KPIs {
  totalUsers: number;
  totalMessages: number;
  totalConversations: number;
  totalRevenue: number;
}

interface ChartPoint {
  date: string;
  count: number;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  creditBalance: number;
  dailyUsageCount: number;
  createdAt: string;
  totalMessages: number;
  totalConversations: number;
  totalTokens: number;
  lastActive: string | null;
}

interface StatsData {
  kpis: KPIs;
  charts: {
    messagesPerDay: ChartPoint[];
    usersPerDay: ChartPoint[];
  };
  users: UserRow[];
}

const planBadgeColors: Record<string, string> = {
  free: "bg-zinc-700 text-zinc-300",
  credits: "bg-indigo-900 text-indigo-300",
  unlimited: "bg-emerald-900 text-emerald-300",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatChartDate(dateStr: string | number) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function timeSince(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}m`;
}

export default function AdminDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    plan: string;
    role: string;
    creditBalance: number;
  }>({ plan: "", role: "", creditBalance: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar estatísticas");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const startEditing = useCallback((u: UserRow) => {
    setEditingId(u.id);
    setEditValues({
      plan: u.plan,
      role: u.role,
      creditBalance: u.creditBalance,
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  const saveUser = useCallback(async () => {
    if (!editingId || !data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Falha ao salvar");
      }
      const updated: UserRow = await res.json();
      setData({
        ...data,
        users: data.users.map((u) => (u.id === updated.id ? updated : u)),
      });
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [editingId, editValues, data]);

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

  const { kpis, charts, users } = data;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Usuários" value={kpis.totalUsers} />
        <KPICard label="Total Mensagens" value={kpis.totalMessages} />
        <KPICard label="Total Conversas" value={kpis.totalConversations} />
        <KPICard
          label="Receita Total"
          value={formatCurrency(kpis.totalRevenue)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted mb-4">
            Mensagens por dia (30d)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
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
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
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
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-muted mb-4">
            Novos usuários por dia (30d)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={charts.usersPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                stroke="#71717a"
                fontSize={12}
              />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(label) => formatChartDate(String(label))}
              />
              <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} name="Usuários" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-medium">Usuários ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-left">
                <th className="px-6 py-3 font-medium">Nome</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Plano</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium text-right">Msgs</th>
                <th className="px-6 py-3 font-medium text-right">Conversas</th>
                <th className="px-6 py-3 font-medium text-right">Créditos</th>
                <th className="px-6 py-3 font-medium">Último uso</th>
                <th className="px-6 py-3 font-medium">Criado em</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editingId === u.id;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border hover:bg-card-hover transition-colors"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="hover:text-indigo-400 transition-colors"
                      >
                        {u.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted">{u.email}</td>
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <select
                          value={editValues.plan}
                          onChange={(e) =>
                            setEditValues({ ...editValues, plan: e.target.value })
                          }
                          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                        >
                          <option value="free">free</option>
                          <option value="credits">credits</option>
                          <option value="unlimited">unlimited</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${planBadgeColors[u.plan] ?? "bg-zinc-800 text-zinc-400"}`}
                        >
                          {u.plan}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <select
                          value={editValues.role}
                          onChange={(e) =>
                            setEditValues({ ...editValues, role: e.target.value })
                          }
                          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-amber-900 text-amber-300" : "bg-zinc-800 text-zinc-400"}`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">{u.totalMessages}</td>
                    <td className="px-6 py-3 text-right">{u.totalConversations}</td>
                    <td className="px-6 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editValues.creditBalance}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              creditBalance: Number(e.target.value),
                            })
                          }
                          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs w-24 text-right"
                        />
                      ) : (
                        u.creditBalance
                      )}
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {u.lastActive ? timeSince(u.lastActive) : "—"}
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={saveUser}
                            disabled={saving}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {saving ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={saving}
                            className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(u)}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
