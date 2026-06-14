'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { LEAD_TYPE_LABELS } from '@/lib/lead-types';

interface DisputeRow {
  id: string;
  status: 'open' | 'resolved';
  reason: string;
  created_at: string;
  lead: { id: string; type: string; city: string; status: string } | null;
  opened_by_user: { id: string; full_name: string } | null;
  opened_by_role: 'author' | 'executor' | null;
}

const TYPE_LABELS = LEAD_TYPE_LABELS;

const ROLE_LABELS: Record<string, string> = {
  author: 'Автор',
  executor: 'Исполнитель',
};

type Tab = 'open' | 'resolved' | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'open', label: 'Открытые' },
  { key: 'resolved', label: 'Решённые' },
  { key: 'all', label: 'Все' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DisputesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('open');
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const qs = tab !== 'all' ? `?status=${tab}` : '';
    try {
      const data = await api.get<DisputeRow[]>(`/moderation/disputes${qs}`);
      setDisputes(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить споры');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Споры</h1>
        <p className="text-sm text-gray-500 mt-0.5">Конфликты между участниками сделок</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Загрузка...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          {tab === 'open' ? 'Открытых споров нет' : 'Споры не найдены'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Тип лида</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Город</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Кто открыл</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Причина</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Дата</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {disputes.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => router.push(`/disputes/${d.id}`)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer relative"
                >
                  {/* Red left indicator for open disputes */}
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {d.status === 'open' && (
                        <div className="w-1 h-8 bg-red-400 rounded-full flex-shrink-0 -ml-1" />
                      )}
                      {TYPE_LABELS[d.lead?.type ?? ''] ?? d.lead?.type ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{d.lead?.city ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-900">{d.opened_by_user?.full_name ?? '—'}</span>
                    {d.opened_by_role && (
                      <span className="ml-1.5 text-xs text-gray-400">
                        ({ROLE_LABELS[d.opened_by_role]})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <span className="line-clamp-1">{d.reason}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(d.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.status === 'open' ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                        Открыт
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                        Решён
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
