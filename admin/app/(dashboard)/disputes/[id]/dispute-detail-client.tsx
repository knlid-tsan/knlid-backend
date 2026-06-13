'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

/* ── Types ─────────────────────────────────────────────── */

interface UserRef { id: string; full_name: string; phone?: string }

interface DisputeDetail {
  dispute: {
    id: string;
    status: 'open' | 'resolved';
    reason: string;
    created_at: string;
    opened_by: string;
    opened_by_user: UserRef | null;
    opened_by_role: 'author' | 'executor' | null;
    resolved_by: string | null;
    resolved_by_user: UserRef | null;
    resolved_at: string | null;
    resolution_comment: string | null;
  };
  lead: {
    id: string;
    type: string;
    status: string;
    city: string;
    description: string;
    created_at: string;
    closed_at: string | null;
    reward_amount: string | null;
    client: { id: string; phone: string; full_name: string; city: string };
    author: { id: string; full_name: string; phone: string; specialization: string; city: string } | null;
    executor: { id: string; full_name: string; phone: string; specialization: string; city: string } | null;
  } | null;
  history: Array<{
    id: string;
    from_status: string | null;
    to_status: string;
    created_at: string;
    comment: string | null;
    changed_by_user: { id: string; full_name: string } | null;
  }>;
  reward: {
    id: string;
    method: string | null;
    value: string | null;
    deal_amount: string | null;
    amount: string | null;
    status: string;
    paid_at: string | null;
  } | null;
}

/* ── Dictionaries ───────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  owner: 'Собственник', buyer: 'Покупатель', mortgage: 'Ипотека', legal: 'Юрист',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый', pending_acceptance: 'Ожидает принятия', in_progress: 'В работе',
  contract: 'Договор', deposit: 'Аванс', closed_success: 'Закрыт успешно',
  cancelled: 'Отменён', dispute: 'Спор', archived: 'В архиве',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800', pending_acceptance: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800', contract: 'bg-blue-100 text-blue-800',
  deposit: 'bg-blue-100 text-blue-800', closed_success: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600', dispute: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-600',
};

const SPEC_LABELS: Record<string, string> = {
  realtor: 'Риелтор', mortgage: 'Ипотечный брокер', lawyer: 'Юрист',
};

const REWARD_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает расчёта', awaiting_payment: 'Ожидает выплаты',
  paid: 'Выплачено', disputed: 'Оспаривается', cancelled: 'Отменено',
};

const REWARD_METHOD_LABELS: Record<string, string> = {
  fixed: 'Фиксированная', percent: 'Процент от сделки',
};

const ROLE_LABELS: Record<string, string> = { author: 'Автор', executor: 'Исполнитель' };

/* ── Helpers ────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */

export default function DisputeDetailClient({ id }: { id: string }) {
  const [data, setData] = useState<DisputeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Resolve form state
  const [outcome, setOutcome] = useState<'closed_success' | 'cancelled' | null>(null);
  const [comment, setComment] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState('');

  function load() {
    setLoading(true);
    setFetchError('');
    api.get<DisputeDetail>(`/moderation/disputes/${id}`)
      .then(setData)
      .catch((err) => setFetchError(err instanceof ApiError ? err.message : 'Не удалось загрузить спор'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResolve() {
    if (!outcome || !comment.trim()) return;
    setResolveLoading(true);
    setResolveError('');
    try {
      const body: Record<string, unknown> = { outcome, resolution_comment: comment };
      if (dealAmount) body.deal_amount = Number(dealAmount);
      await api.post(`/moderation/disputes/${id}/resolve`, body);
      setConfirmOpen(false);
      setOutcome(null);
      setComment('');
      setDealAmount('');
      load(); // refresh
    } catch (err) {
      setResolveError(err instanceof ApiError ? err.message : 'Ошибка при принятии решения');
      setConfirmOpen(false);
    } finally {
      setResolveLoading(false);
    }
  }

  /* ── Loading / error states ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Загрузка...</div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="space-y-4">
        <Link href="/disputes" className="text-sm text-blue-600 hover:underline">← Споры</Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {fetchError || 'Спор не найден'}
        </div>
      </div>
    );
  }

  const { dispute, lead, history, reward } = data;
  const isOpen = dispute.status === 'open';

  /* ── Render ── */

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/disputes" className="text-sm text-blue-600 hover:underline">← Споры</Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-semibold text-gray-900">
          Спор по лиду{lead ? ` · ${TYPE_LABELS[lead.type] ?? lead.type}, ${lead.city}` : ''}
        </h1>
        {isOpen ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
            Открыт
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
            Решён
          </span>
        )}
      </div>

      {/* Dispute cause */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Причина спора</p>
        <p className="text-base text-red-900 font-medium leading-relaxed">{dispute.reason}</p>
        <p className="text-xs text-red-400 mt-2">
          Открыл{' '}
          <span className="font-medium text-red-600">
            {dispute.opened_by_user?.full_name ?? '—'}
          </span>
          {dispute.opened_by_role && (
            <span className="ml-1">({ROLE_LABELS[dispute.opened_by_role]})</span>
          )}
          {' · '}{formatDate(dispute.created_at)}
        </p>
      </div>

      {/* Resolution verdict (if resolved) */}
      {!isOpen && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Решение</p>
          <p className="text-sm text-green-900 font-medium">
            {dispute.resolution_comment || 'Комментарий не указан'}
          </p>
          <p className="text-xs text-green-500 mt-2">
            Решил{' '}
            <span className="font-medium text-green-700">
              {dispute.resolved_by_user?.full_name ?? '—'}
            </span>
            {dispute.resolved_at && <> · {formatDate(dispute.resolved_at)}</>}
          </p>
        </div>
      )}

      {/* Lead context */}
      {lead && (
        <>
          <Section title="Лид">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 mb-3">
              <Field label="Тип" value={TYPE_LABELS[lead.type] ?? lead.type} />
              <Field label="Город" value={lead.city} />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Статус</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[lead.status] ?? lead.status}
                </span>
              </div>
              <Field label="Создан" value={formatDate(lead.created_at)} />
              {lead.closed_at && <Field label="Закрыт" value={formatDate(lead.closed_at)} />}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Описание</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{lead.description}</p>
            </div>
          </Section>

          {/* Client */}
          <Section title="Клиент">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <Field label="Имя" value={lead.client.full_name} />
              <Field label="Телефон" value={lead.client.phone} />
              <Field label="Город" value={lead.client.city} />
            </div>
          </Section>

          {/* Author & executor */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Section title="Автор">
              {lead.author ? (
                <div className="grid grid-cols-1 gap-y-3">
                  <Field label="Имя" value={lead.author.full_name} />
                  <Field label="Телефон" value={lead.author.phone} />
                  <Field label="Специализация" value={SPEC_LABELS[lead.author.specialization] ?? lead.author.specialization} />
                  <Field label="Город" value={lead.author.city} />
                </div>
              ) : <p className="text-sm text-gray-400">Автор не найден</p>}
            </Section>
            <Section title="Исполнитель">
              {lead.executor ? (
                <div className="grid grid-cols-1 gap-y-3">
                  <Field label="Имя" value={lead.executor.full_name} />
                  <Field label="Телефон" value={lead.executor.phone} />
                  <Field label="Специализация" value={SPEC_LABELS[lead.executor.specialization] ?? lead.executor.specialization} />
                  <Field label="Город" value={lead.executor.city} />
                </div>
              ) : <p className="text-sm text-gray-400">Не назначен</p>}
            </Section>
          </div>
        </>
      )}

      {/* Reward */}
      {reward && (
        <Section title="Вознаграждение">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <Field label="Метод" value={reward.method ? (REWARD_METHOD_LABELS[reward.method] ?? reward.method) : '—'} />
            {reward.deal_amount && (
              <Field label="Сумма сделки" value={`${Number(reward.deal_amount).toLocaleString('ru-RU')} ₽`} />
            )}
            {reward.amount && (
              <Field label="Вознаграждение" value={`${Number(reward.amount).toLocaleString('ru-RU')} ₽`} />
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Статус выплаты</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                reward.status === 'paid' ? 'bg-green-100 text-green-800'
                  : reward.status === 'disputed' ? 'bg-red-100 text-red-700'
                  : reward.status === 'cancelled' ? 'bg-gray-100 text-gray-600'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {REWARD_STATUS_LABELS[reward.status] ?? reward.status}
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* Status history */}
      <Section title="История статусов">
        {history.length === 0 ? (
          <p className="text-sm text-gray-400">История пуста</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-2 space-y-4">
            {history.map((entry, idx) => (
              <li key={entry.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-gray-300" />
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.from_status ? (
                    <>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.from_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[entry.from_status] ?? entry.from_status}
                      </span>
                      <span className="text-gray-400 text-xs">→</span>
                    </>
                  ) : idx === 0 ? (
                    <span className="text-xs text-gray-400">Создан со статусом</span>
                  ) : null}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.to_status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[entry.to_status] ?? entry.to_status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(entry.created_at)}
                  {entry.changed_by_user && <span className="ml-1">· {entry.changed_by_user.full_name}</span>}
                </p>
                {entry.comment && (
                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">{entry.comment}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>

      {/* Resolution panel (open disputes only) */}
      {isOpen && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Принять решение
          </h2>

          {resolveError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {resolveError}
            </div>
          )}

          {/* Outcome buttons */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
            <button
              onClick={() => setOutcome(outcome === 'closed_success' ? null : 'closed_success')}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${
                outcome === 'closed_success'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">Признать сделку успешной</p>
              <p className="text-xs text-gray-500">
                Лид получит статус «Закрыт успешно». Вознаграждение будет переведено в статус
                «Ожидает выплаты».
              </p>
            </button>
            <button
              onClick={() => setOutcome(outcome === 'cancelled' ? null : 'cancelled')}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${
                outcome === 'cancelled'
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 hover:border-red-300 hover:bg-red-50/30'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">Отменить лид</p>
              <p className="text-xs text-gray-500">
                Лид будет отменён. Если вознаграждение было начислено — оно аннулируется.
              </p>
            </button>
          </div>

          {outcome && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий решения <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Поясните решение для участников сделки..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              {outcome === 'closed_success' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Сумма сделки, ₽{' '}
                    <span className="text-gray-400 font-normal text-xs">(необязательно, для процентного тарифа)</span>
                  </label>
                  <input
                    type="number"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                    placeholder="0"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                </div>
              )}
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!comment.trim()}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  outcome === 'closed_success'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {outcome === 'closed_success' ? 'Подтвердить успех сделки' : 'Подтвердить отмену лида'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmOpen && outcome && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setConfirmOpen(false)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Вы уверены?</h2>
            <p className="text-sm text-gray-600 mb-1">
              {outcome === 'closed_success'
                ? 'Лид будет помечен как «Закрыт успешно», вознаграждение перейдёт в ожидание выплаты.'
                : 'Лид будет отменён, вознаграждение аннулировано.'}
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResolve}
                disabled={resolveLoading}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  outcome === 'closed_success'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {resolveLoading ? 'Сохранение...' : 'Да, подтвердить'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={resolveLoading}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
