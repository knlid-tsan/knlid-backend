'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface Application {
  id: string;
  user_id: string;
  user_name: string | null;
  user_specialization: string | null;
  user_city: string | null;
  user_rating: number | string | null;
  status: string;
  created_at: string;
}

const SPEC_LABEL: Record<string, string> = {
  realtor: 'Риелтор',
  mortgage_broker: 'Ипотечный брокер',
  lawyer: 'Юрист',
};

const TABS = [
  { value: 'pending', label: 'Ожидающие' },
  { value: '', label: 'Все' },
] as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function ApplicationsPage() {
  const [tab, setTab] = useState<string>('pending');
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError('');
    try {
      const qs = status ? `?status=${status}` : '';
      const data = await api.get<Application[]>(`/companies/me/applications${qs}`);
      setItems(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  async function handleAction(membershipId: string, action: 'approve' | 'reject') {
    setActionLoading(membershipId + action);
    setActionError('');
    try {
      await api.post(`/companies/me/applications/${membershipId}/${action}`);
      await load(tab);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Ошибка при обработке заявки');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Заявки специалистов</h1>
        <p className="text-sm text-gray-500 mt-0.5">Входящие запросы на привязку к компании</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.value
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {actionError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Специалист</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Специализация</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Город</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Рейтинг</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Дата заявки</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Статус</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    Заявок нет
                  </td>
                </tr>
              )
              : items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {item.user_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {item.user_specialization
                        ? (SPEC_LABEL[item.user_specialization] ?? item.user_specialization)
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{item.user_city ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {item.user_rating != null ? Number(item.user_rating).toFixed(1) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(item.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {item.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item.id, 'approve')}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === item.id + 'approve' ? '...' : 'Подтвердить'}
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'reject')}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {actionLoading === item.id + 'reject' ? '...' : 'Отклонить'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'Ожидает',   cls: 'bg-amber-100 text-amber-700' },
    active:   { label: 'Принята',   cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Отклонена', cls: 'bg-red-100 text-red-700' },
    ended:    { label: 'Завершена', cls: 'bg-gray-100 text-gray-500' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
