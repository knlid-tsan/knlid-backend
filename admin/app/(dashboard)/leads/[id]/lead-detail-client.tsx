'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { LEAD_TYPE_LABELS } from '@/lib/lead-types';
import { formatPhone, formatMoney } from '@/lib/format';

interface HistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  created_at: string;
  comment: string | null;
  changed_by_user: { id: string; full_name: string } | null;
}

interface Reward {
  id: string;
  method: string | null;
  value: string | null;
  commission_amount: string | null;
  amount: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface Dispute {
  id: string;
  reason: string;
  status: string;
  opened_by: string;
  created_at: string;
  resolution_comment: string | null;
  resolved_at: string | null;
}

interface Candidate {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  specialization: string;
  rating: number;
  leads_closed: number;
  company_name: string | null;
}

interface CandidatesResponse {
  lead_id: string;
  lead_city: string;
  required_specialization: string;
  required_specialization_label: string;
  candidates: Candidate[];
}

interface LeadDetail {
  id: string;
  type: string;
  status: string;
  city: string;
  description: string;
  created_at: string;
  closed_at: string | null;
  reward_amount: string | null;
  reward_paid: boolean;
  is_duplicate: boolean;
  duplicate_of_id: string | null;
  client: { id: string; phone: string; full_name: string; city: string; created_at: string };
  author: { id: string; full_name: string; phone: string; specialization: string; city: string } | null;
  executor: { id: string; full_name: string; phone: string; specialization: string; city: string } | null;
  history: HistoryEntry[];
  reward: Reward | null;
  dispute: Dispute | null;
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

const SPEC_LABELS: Record<string, string> = {
  realtor: 'Риелтор',
  mortgage: 'Ипотечный брокер',
  lawyer: 'Юрист',
};

const REWARD_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает расчёта',
  awaiting_payment: 'Ожидает выплаты',
  paid: 'Выплачено',
  disputed: 'Оспаривается',
  cancelled: 'Отменено',
};

const REWARD_METHOD_LABELS: Record<string, string> = {
  fixed: 'Фиксированная',
  percent: 'Процент от сделки',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{title}</h2>
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

export default function LeadDetailClient({ id }: { id: string }) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCandidates, setShowCandidates] = useState(false);
  const [candidatesData, setCandidatesData] = useState<CandidatesResponse | null>(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState('');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState('');

  const fetchLead = useCallback(() => {
    return api
      .get<LeadDetail>(`/admin/leads/${id}`)
      .then(setLead)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить лид'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  async function loadCandidates() {
    setShowCandidates(true);
    setCandidatesLoading(true);
    setCandidatesError('');
    setAssignError('');
    try {
      const data = await api.get<CandidatesResponse>(`/admin/leads/${id}/candidates`);
      setCandidatesData(data);
    } catch (err) {
      setCandidatesError(err instanceof ApiError ? err.message : 'Не удалось загрузить кандидатов');
    } finally {
      setCandidatesLoading(false);
    }
  }

  async function doAssign(executorId: string) {
    setAssigning(executorId);
    setAssignError('');
    try {
      await api.post(`/leads/${id}/assign`, { executor_id: executorId });
      setShowCandidates(false);
      setCandidatesData(null);
      setLoading(true);
      await fetchLead();
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : 'Не удалось назначить исполнителя');
    } finally {
      setAssigning(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Загрузка...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link href="/leads" className="text-sm text-blue-600 hover:underline">
          ← Назад к лидам
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error || 'Лид не найден'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/leads" className="text-sm text-blue-600 hover:underline">
          ← Лиды
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-semibold text-gray-900">
          {TYPE_LABELS[lead.type] ?? lead.type}
        </h1>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {STATUS_LABELS[lead.status] ?? lead.status}
        </span>
        {lead.is_duplicate && (
          <span className="bg-orange-100 text-orange-700 text-xs font-medium rounded-full px-2.5 py-0.5">
            Дубликат
          </span>
        )}
      </div>

      {/* Dispute banner */}
      {lead.dispute && lead.dispute.status === 'open' && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-1">Открыт спор</p>
          <p className="text-sm text-red-600">{lead.dispute.reason}</p>
          <p className="text-xs text-red-400 mt-1">
            Открыт {formatDate(lead.dispute.created_at)}
          </p>
        </div>
      )}

      {/* Description */}
      <Section title="Описание / суть запроса">
        {lead.description ? (
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{lead.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Описание не указано</p>
        )}
      </Section>

      {/* Main info */}
      <Section title="Основное">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          <Field label="Тип" value={TYPE_LABELS[lead.type] ?? lead.type} />
          <Field label="Город" value={lead.city} />
          <Field label="Создан" value={formatDate(lead.created_at)} />
          {lead.closed_at && <Field label="Закрыт" value={formatDate(lead.closed_at)} />}
          {lead.duplicate_of_id && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Дубликат лида</p>
              <Link
                href={`/leads/${lead.duplicate_of_id}`}
                className="text-sm text-blue-600 hover:underline font-mono"
              >
                {lead.duplicate_of_id.slice(0, 8)}…
              </Link>
            </div>
          )}
        </div>
      </Section>

      {/* Client */}
      <Section title="Клиент">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          <Field label="Имя" value={lead.client.full_name} />
          <Field label="Телефон" value={formatPhone(lead.client.phone)} />
          <Field label="Город" value={lead.client.city} />
        </div>
      </Section>

      {/* Author & executor */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section title="Автор">
          {lead.author ? (
            <div className="grid grid-cols-1 gap-y-3">
              <Field label="Имя" value={lead.author.full_name} />
              <Field label="Телефон" value={formatPhone(lead.author.phone)} />
              <Field label="Специализация" value={SPEC_LABELS[lead.author.specialization] ?? lead.author.specialization} />
              <Field label="Город" value={lead.author.city} />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Автор не найден</p>
          )}
        </Section>
        <Section title="Исполнитель">
          {lead.executor ? (
            <div className="grid grid-cols-1 gap-y-3">
              <Field label="Имя" value={lead.executor.full_name} />
              <Field label="Телефон" value={formatPhone(lead.executor.phone)} />
              <Field label="Специализация" value={SPEC_LABELS[lead.executor.specialization] ?? lead.executor.specialization} />
              <Field label="Город" value={lead.executor.city} />
            </div>
          ) : lead.status === 'new' ? (
            <div>
              <p className="text-sm text-gray-400 mb-3">Не назначен</p>
              {!showCandidates ? (
                <button
                  onClick={loadCandidates}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Подобрать исполнителя
                </button>
              ) : (
                <button
                  onClick={() => { setShowCandidates(false); setAssignError(''); }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Скрыть подбор ↑
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Не назначен</p>
          )}
        </Section>
      </div>

      {/* Candidates panel — full width, only for new leads */}
      {showCandidates && lead.status === 'new' && (
        <Section title="Подбор исполнителя">
          {assignError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
              {assignError}
            </div>
          )}
          {candidatesLoading ? (
            <p className="text-sm text-gray-400">Загрузка...</p>
          ) : candidatesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {candidatesError}
            </div>
          ) : candidatesData && candidatesData.candidates.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              В городе <span className="font-semibold">{candidatesData.lead_city}</span> нет доступных верифицированных специалистов
              по специализации <span className="font-semibold">{candidatesData.required_specialization_label}</span>.
              Лид остаётся в очереди.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Специалист</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Телефон</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Город</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Рейтинг</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Закрыто лидов</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {candidatesData?.candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 text-gray-900 font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{c.full_name}</span>
                        {c.company_name && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2 py-0.5 whitespace-nowrap">
                            Гарант: {c.company_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">{formatPhone(c.phone)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{c.city}</td>
                    <td className="px-3 py-2.5 text-gray-600">{Number(c.rating).toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{c.leads_closed}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => doAssign(c.id)}
                        disabled={assigning !== null}
                        className="bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {assigning === c.id ? 'Назначение...' : 'Назначить'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}

      {/* Reward */}
      {lead.reward && (
        <Section title="Вознаграждение">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <Field
              label="Метод"
              value={lead.reward.method ? (REWARD_METHOD_LABELS[lead.reward.method] ?? lead.reward.method) : '—'}
            />
            {lead.reward.commission_amount && (
              <Field
                label="Комиссия специалиста"
                value={formatMoney(lead.reward.commission_amount)}
              />
            )}
            {lead.reward.amount && (
              <Field
                label="Сумма вознаграждения"
                value={formatMoney(lead.reward.amount)}
              />
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Статус выплаты</p>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  lead.reward.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : lead.reward.status === 'disputed'
                    ? 'bg-red-100 text-red-700'
                    : lead.reward.status === 'cancelled'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {REWARD_STATUS_LABELS[lead.reward.status] ?? lead.reward.status}
              </span>
            </div>
            {lead.reward.paid_at && (
              <Field label="Выплачено" value={formatDate(lead.reward.paid_at)} />
            )}
          </div>
        </Section>
      )}

      {/* Status history timeline */}
      <Section title="История статусов">
        {lead.history.length === 0 ? (
          <p className="text-sm text-gray-400">История пуста</p>
        ) : (
          <ol className="relative border-l border-gray-200 ml-2 space-y-4">
            {lead.history.map((entry, idx) => (
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
                  {entry.changed_by_user && (
                    <span className="ml-1">· {entry.changed_by_user.full_name}</span>
                  )}
                </p>
                {entry.comment && (
                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                    {entry.comment}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
