'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { LEAD_TYPE_LABELS } from '@/lib/lead-types';

interface AdminLeadRow {
  id: string;
  type: string;
  status: string;
  city: string;
  created_at: string;
  closed_at: string | null;
  reward_amount: string | null;
  author: { id: string; full_name: string; phone: string } | null;
  executor: { id: string; full_name: string; phone: string } | null;
}

interface LeadsResponse {
  data: AdminLeadRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  pending_acceptance: 'Ожидает принятия',
  in_progress: 'В работе',
  contract: 'Договор',
  deposit: 'Аванс',
  closed_success: 'Закрыт успешно',
  cancelled: 'Отменён',
  dispute: 'Спор',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  pending_acceptance: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  contract: 'bg-blue-100 text-blue-800',
  deposit: 'bg-blue-100 text-blue-800',
  closed_success: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  dispute: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS = LEAD_TYPE_LABELS;

const ALL_STATUSES = Object.keys(STATUS_LABELS);
const ALL_TYPES = Object.keys(TYPE_LABELS);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function LeadsPage() {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [appliedCity, setAppliedCity] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [leads, setLeads] = useState<AdminLeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (appliedCity) params.set('city', appliedCity);
    params.set('page', String(page));
    params.set('limit', String(limit));

    try {
      const res = await api.get<LeadsResponse>(`/admin/leads?${params}`);
      setLeads(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить лиды');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, appliedCity, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function applyFilters() {
    setAppliedCity(cityFilter);
    setPage(1);
  }

  function resetFilters() {
    setStatusFilter('');
    setTypeFilter('');
    setCityFilter('');
    setAppliedCity('');
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Лиды</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Все лиды платформы
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Статус</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Все статусы</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Тип</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Все типы</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Город</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Поиск по городу"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
            />
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Найти
            </button>
          </div>
        </div>
        {(statusFilter || typeFilter || appliedCity) && (
          <button
            onClick={resetFilters}
            className="text-sm text-gray-400 hover:text-gray-600 self-end pb-0.5 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Загрузка...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Лиды не найдены
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Город</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Автор</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Исполнитель</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Вознаграждение</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap font-medium">
                    {TYPE_LABELS[lead.type] ?? lead.type}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.city}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lead.author?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lead.executor?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {lead.reward_amount
                      ? `${Number(lead.reward_amount).toLocaleString('ru-RU')} ₽`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            <span className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-gray-50">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
