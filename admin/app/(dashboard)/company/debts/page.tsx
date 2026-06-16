'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';

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
        <h1 className="text-xl font-semibold text-foreground">Долги к покрытию</h1>
        <p className="text-sm text-muted mt-0.5">Просроченные выплаты специалистов вашей компании</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {payingId !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-foreground mb-1">Покрыть долг</h3>
            <p className="text-sm text-muted mb-4">
              Укажите ссылку на документ, подтверждающий перевод средств.
            </p>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-1"
            />
            {payError && (
              <p className="text-xs text-brand mb-3">{payError}</p>
            )}
            {!payError && <div className="mb-3" />}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
              После подтверждения долг будет закрыт. Убедитесь, что ссылка корректна.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelPay}
                disabled={paying}
                className="px-4 py-2 text-sm text-muted border border-divider rounded-lg hover:bg-background disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmPay}
                disabled={paying || !proofUrl.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50"
              >
                {paying ? 'Обрабатываю...' : 'Подтвердить оплату'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-divider shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider bg-background/70">
              <th className="text-left px-5 py-3 font-medium text-muted">Исполнитель</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Автор лида</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Сумма</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Дата просрочки</th>
              <th className="text-left px-5 py-3 font-medium text-muted">Лид</th>
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
                    Долгов нет
                  </td>
                </tr>
              )
              : items.map((d) => {
                  const overdue = isOverdue(d.payment_due_at);
                  return (
                    <tr key={d.reward_id} className="hover:bg-background/60 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        {d.executor?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-foreground">
                        {d.author?.full_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        {formatMoney(d.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                        <span className={overdue ? 'text-brand font-medium' : 'text-muted'}>
                          {fmtDate(d.payment_due_at)}
                          {overdue && ' (просрочен)'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-muted text-xs">
                        {d.lead_id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => startPay(d.reward_id)}
                          className="px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
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
