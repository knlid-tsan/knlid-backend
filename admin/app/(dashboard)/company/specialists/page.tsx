'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface Specialist {
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function SpecialistsPage() {
  const [items, setItems] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Specialist[]>('/companies/me/specialists');
      setItems(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить список специалистов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(membershipId: string) {
    setRemoving(true);
    setActionError('');
    try {
      await api.post(`/companies/me/specialists/${membershipId}/remove`);
      setConfirmId(null);
      await load();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Ошибка при отвязке специалиста');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Мои специалисты</h1>
        <p className="text-sm text-muted mt-0.5">Специалисты под гарантией вашей компании</p>
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

      {confirmId !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold text-foreground mb-2">Отвязать специалиста?</h3>
            <p className="text-sm text-muted mb-5">
              Специалист будет удалён из-под гарантии компании. Это действие нельзя отменить.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                disabled={removing}
                className="px-4 py-2 text-sm text-muted border border-divider rounded-lg hover:bg-background disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={() => handleRemove(confirmId)}
                disabled={removing}
                className="px-4 py-2 text-sm font-medium bg-brand hover:bg-brand/90 text-white rounded-lg disabled:opacity-50"
              >
                {removing ? 'Отвязываю...' : 'Отвязать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-divider shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider bg-background/70">
              <th className="text-left px-5 py-3 font-medium text-muted">Специалист</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Специализация</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Город</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Рейтинг</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Привязан с</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-divider rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                    Нет активных специалистов
                  </td>
                </tr>
              )
              : items.map((item) => (
                  <tr key={item.id} className="hover:bg-background/60 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      {item.user_name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-foreground">
                      {item.user_specialization
                        ? (SPEC_LABEL[item.user_specialization] ?? item.user_specialization)
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-foreground">{item.user_city ?? '—'}</td>
                    <td className="px-5 py-3.5 text-foreground">
                      {item.user_rating != null ? Number(item.user_rating).toFixed(1) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-muted text-xs whitespace-nowrap">
                      {fmtDate(item.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setConfirmId(item.id)}
                        className="px-3 py-1.5 text-xs font-medium text-brand border border-brand/30 rounded-lg hover:bg-brand/5 transition-colors"
                      >
                        Отвязать
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
