'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';

interface Company {
  id: string;
  name: string;
  bin: string;
  phone: string;
  city: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_TABS = [
  { value: 'pending', label: 'Ожидают' },
  { value: 'active', label: 'Активные' },
  { value: 'rejected', label: 'Отклонённые' },
  { value: 'blocked', label: 'Заблокированные' },
  { value: '', label: 'Все' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'На рассмотрении',
  active: 'Активна',
  rejected: 'Отклонена',
  blocked: 'Заблокирована',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-gray-200 text-gray-600',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_CLASS[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function CompaniesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<string>('pending');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError('');
    try {
      const params = status ? `?status=${status}` : '';
      const data = await api.get<Company[]>(`/moderation/companies${params}`);
      setCompanies(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить список компаний');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Компании</h1>
        <p className="text-sm text-gray-500 mt-0.5">Модерация компаний-гарантов</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {STATUS_TABS.map((t) => (
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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Название</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">БИН</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Город</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Телефон</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Дата заявки</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              : companies.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                    Компаний с таким статусом нет
                  </td>
                </tr>
              )
              : companies.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/companies/${c.id}`)}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">{c.name}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs tracking-wide">{c.bin}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.city}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs">{c.phone}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(c.created_at)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
