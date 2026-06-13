'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api, ApiError } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientLeads {
  total: number;
  active: number;
  closed_success: number;
  cancelled: number;
}

interface Client {
  id: string;
  full_name: string;
  city: string;
  phone_masked: string;
  created_at: string;
  leads: ClientLeads;
}

interface ClientsResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const HIGHLIGHT_THRESHOLD = 3;

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      setDataError('');
      try {
        const params = new URLSearchParams({ page: String(p), limit: String(limit) });
        if (q) params.set('search', q);
        const res = await api.get<ClientsResponse>(`/admin/clients?${params}`);
        setClients(res.data);
        setTotal(res.total);
        setPage(res.page);
      } catch (err) {
        setDataError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1, search);
  }, [search, load]);

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(value);
    }, 400);
  }

  function goPage(p: number) {
    load(p, search);
  }

  const totalPages = Math.ceil(total / limit);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Клиенты</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Аналитика по клиентам — история и активность обращений
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
          <span>3+ лида — активный клиент</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Поиск по имени или городу..."
          className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      {/* Error */}
      {dataError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {dataError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Клиент</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Город</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Телефон</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Лиды</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Статусы</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  {search ? `Клиентов по запросу «${search}» не найдено` : 'Клиентов пока нет'}
                </td>
              </tr>
            ) : (
              clients.map((c) => {
                const isActive = c.leads.total >= HIGHLIGHT_THRESHOLD;
                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      isActive
                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                        : 'hover:bg-gray-50/40'
                    }`}
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {c.full_name}
                    </td>

                    {/* City */}
                    <td className="px-5 py-3.5 text-gray-600">{c.city}</td>

                    {/* Phone masked */}
                    <td className="px-5 py-3.5 font-mono text-sm text-gray-700 tracking-wide">
                      {c.phone_masked}
                    </td>

                    {/* Total leads badge */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                          isActive
                            ? 'bg-amber-100 text-amber-800'
                            : c.leads.total === 0
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.leads.total}
                      </span>
                    </td>

                    {/* Status breakdown */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.leads.active > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                            {c.leads.active} акт.
                          </span>
                        )}
                        {c.leads.closed_success > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            {c.leads.closed_success} успешно
                          </span>
                        )}
                        {c.leads.cancelled > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                            {c.leads.cancelled} отм.
                          </span>
                        )}
                        {c.leads.total === 0 && (
                          <span className="text-xs text-gray-400">нет лидов</span>
                        )}
                      </div>
                    </td>

                    {/* Created at */}
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(c.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p as number)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      p === page
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Total count when no pagination */}
      {!loading && totalPages <= 1 && total > 0 && (
        <p className="mt-3 text-xs text-gray-400">{total} клиент{total === 1 ? '' : total < 5 ? 'а' : 'ов'}</p>
      )}
    </>
  );
}
