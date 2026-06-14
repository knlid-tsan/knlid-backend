'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface Debt {
  reward_id: string;
  lead_id: string;
  amount: number | string;
  payment_due_at: string;
  executor: { id: string; full_name: string } | null;
  author: { id: string; full_name: string } | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function isOverdue(iso: string) {
  return new Date(iso) < new Date();
}

export default function DebtsPage() {
  const [items, setItems] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment flow state
  const [payingId, setPayingId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Debt[]>('/companies/me/debts');
      setItems(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить долги');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startPay(rewardId: string) {
    setPayingId(rewardId);
    setProofUrl('');
    setPayError('');
  }

  function cancelPay() {
    setPayingId(null);
    setProofUrl('');
    setPayError('');
  }

  async function confirmPay() {
    if (!payingId) return;
    if (!proofUrl.trim()) {
      setPayError('Укажите ссылку на подтверждение оплаты');
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      await api.post(`/companies/me/debts/${payingId}/pay`, { proof_url: proofUrl.trim() });
      setPayingId(null);
      setProofUrl('');
      await load();
    } catch (e) {
      setPayError(e instanceof ApiError ? e.message : 'Ошибка при покрытии долга');
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Долги к покрытию</h1>
        <p className="text-sm text-gray-500 mt-0.5">Просроченные выплаты специалистов вашей компании</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Pay modal */}
      {payingId !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-gray-900 mb-1">Покрыть долг</h3>
            <p className="text-sm text-gray-500 mb-4">
              Укажите ссылку на документ, подтверждающий перевод средств.
            </p>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 mb-1"
            />
            {payError && (
              <p className="text-xs text-red-600 mb-3">{payError}</p>
            )}
            {!payError && <div className="mb-3" />}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
              После подтверждения долг будет закрыт. Убедитесь, что ссылка корректна.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelPay}
                disabled={paying}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmPay}
                disabled={paying || !proofUrl.trim()}
                className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg disabled:opacity-50"
              >
                {paying ? 'Обрабатываю...' : 'Подтвердить оплату'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Исполнитель</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Автор лида</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Сумма</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Дата просрочки</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Лид</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                    Долгов нет
                  </td>
                </tr>
              )
              : items.map((d) => {
                  const overdue = isOverdue(d.payment_due_at);
                  return (
                    <tr key={d.reward_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {d.executor?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {d.author?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {Number(d.amount).toLocaleString('ru-RU')} ₸
                      </td>
                      <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {fmtDate(d.payment_due_at)}
                          {overdue && ' (просрочен)'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-gray-500 text-xs">
                        {d.lead_id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => startPay(d.reward_id)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
                        >
                          Покрыть
                        </button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </>
  );
}
