'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { formatPhone } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_name: string | null;
  actor_phone: string | null;
  entity_name: string | null;
}

interface AuditResponse {
  data: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dictionaries ─────────────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  user_registered: 'Регистрация',
  profile_updated: 'Изменён профиль',
  user_blocked: 'Пользователь заблокирован',
  user_unblocked: 'Пользователь разблокирован',
  user_role_changed: 'Изменена роль',
  user_reverification_requested: 'Сброс верификации',
  document_uploaded: 'Загружен документ',
  verification_approved: 'Верификация одобрена',
  verification_rejected: 'Верификация отклонена',
  specialist_created_by_moderator: 'Создан специалист',
  company_created_by_moderator: 'Создана компания',
  company_registered: 'Регистрация компании',
  company_document_uploaded: 'Документ компании',
  company_approved: 'Компания одобрена',
  company_rejected: 'Компания отклонена',
  lead_created: 'Создан лид',
  lead_assigned: 'Лид назначен',
  lead_accepted: 'Лид принят',
  lead_declined: 'Лид отклонён',
  lead_status_changed: 'Смена статуса лида',
  view_client_phone: 'Просмотр телефона',
  reward_created: 'Создано вознаграждение',
  reward_paid: 'Вознаграждение выплачено',
  reward_disputed: 'Вознаграждение оспорено',
  reward_proof_attached: 'Подтверждение выплаты',
  reward_confirmed: 'Выплата подтверждена',
  reward_auto_confirmed: 'Выплата авто-подтверждена',
  reward_overdue: 'Вознаграждение просрочено',
  dispute_opened: 'Открыт спор',
  dispute_resolved: 'Спор разрешён',
  membership_applied: 'Заявка в компанию',
  membership_approved: 'Заявка одобрена',
  membership_rejected: 'Заявка отклонена',
  membership_left: 'Вышел из компании',
  membership_removed: 'Исключён из компании',
  membership_auto_ended: 'Членство завершено',
  membership_assigned_by_moderator: 'Привязан к компании',
  membership_removed_by_moderator: 'Отвязан от компании',
  debt_transferred_to_company: 'Долг на компанию',
  debt_paid_by_company: 'Долг погашен',
  setting_updated: 'Изменена настройка',
  assignment_override: 'Принудительное назначение',
  tariff_upsert: 'Тариф изменён',
  tariff_delete: 'Тариф удалён',
};

const SPEC_LABEL: Record<string, string> = {
  realtor: 'Риелтор', mortgage: 'Ипотечный брокер', lawyer: 'Юрист',
};
const ROLE_LABEL: Record<string, string> = {
  user: 'Специалист', moderator: 'Модератор', admin: 'Администратор', company: 'Компания',
};
const LEAD_STATUS_LABEL: Record<string, string> = {
  new: 'Новый', pending_acceptance: 'Ожидает принятия', in_progress: 'В работе',
  contract: 'Договор', deposit: 'Задаток', closed_success: 'Успешно закрыт',
  cancelled: 'Отменён', dispute: 'Спор', archived: 'Архив',
};

const ENTITY_TYPE_LABEL: Record<string, string> = {
  user: 'Пользователь', lead: 'Лид', reward: 'Вознаграждение',
  company: 'Компания', membership: 'Членство', setting: 'Настройка', tariff: 'Тариф',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function shortId(id: string) {
  return id.slice(0, 8) + '…';
}

function actionColor(action: string): string {
  if (action === 'profile_updated') return 'bg-violet-100 text-violet-700';
  if (action === 'user_role_changed') return 'bg-slate-100 text-slate-700';
  if (action === 'user_blocked' || action === 'dispute_opened' || action.includes('rejected')) return 'bg-red-100 text-red-700';
  if (action === 'user_unblocked' || action.includes('approved') || action === 'dispute_resolved') return 'bg-green-100 text-green-700';
  if (action.includes('verification') || action.includes('document')) return 'bg-amber-100 text-amber-700';
  if (action.includes('lead')) return 'bg-blue-100 text-blue-700';
  if (action.includes('reward') || action.includes('debt')) return 'bg-orange-100 text-orange-700';
  if (action.includes('created_by') || action.includes('registered')) return 'bg-teal-100 text-teal-700';
  if (action.includes('membership')) return 'bg-cyan-100 text-cyan-700';
  return 'bg-gray-100 text-gray-600';
}

function renderMeta(action: string, meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return '';

  if (action === 'profile_updated') {
    const parts: string[] = [];
    if (meta.full_name) parts.push(`ФИО: ${meta.full_name}`);
    if (meta.specialization) parts.push(`Специализация: ${SPEC_LABEL[meta.specialization as string] ?? meta.specialization}`);
    if (meta.city) parts.push(`Город: ${meta.city}`);
    return parts.join(' · ') || '';
  }

  if (action === 'user_role_changed') {
    const from = ROLE_LABEL[meta.from as string] ?? meta.from;
    const to = ROLE_LABEL[meta.to as string] ?? meta.to;
    return `${from} → ${to}`;
  }

  if (action === 'lead_status_changed') {
    const from = LEAD_STATUS_LABEL[meta.from as string] ?? meta.from;
    const to = LEAD_STATUS_LABEL[meta.to as string] ?? meta.to;
    return `${from} → ${to}`;
  }

  if (action === 'verification_rejected' && meta.reason) {
    return `Причина: ${meta.reason}`;
  }

  if (action === 'specialist_created_by_moderator' || action === 'company_created_by_moderator') {
    const parts: string[] = [];
    if (meta.phone) parts.push(formatPhone(meta.phone as string));
    if (meta.specialization) parts.push(SPEC_LABEL[meta.specialization as string] ?? meta.specialization as string);
    if (meta.city) parts.push(meta.city as string);
    return parts.join(' · ');
  }

  // Generic fallback: key: value pairs, skip nulls
  return Object.entries(meta)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
}

// ─── Filter options ────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: '', label: 'Все события' },
  // --- Группа: профили ---
  { value: 'profile_updated', label: 'Изменения профилей', group: 'Профили' },
  { value: 'user_role_changed', label: 'Смены ролей', group: 'Профили' },
  { value: 'user_blocked', label: 'Блокировки', group: 'Профили' },
  { value: 'user_unblocked', label: 'Разблокировки', group: 'Профили' },
  { value: 'user_registered', label: 'Регистрации', group: 'Профили' },
  // --- Группа: верификация ---
  { value: 'verification_approved', label: 'Верификация: одобрено', group: 'Верификация' },
  { value: 'verification_rejected', label: 'Верификация: отклонено', group: 'Верификация' },
  { value: 'user_reverification_requested', label: 'Сброс верификации', group: 'Верификация' },
  // --- Группа: специалисты и компании ---
  { value: 'specialist_created_by_moderator', label: 'Создание специалиста', group: 'Мод. действия' },
  { value: 'company_created_by_moderator', label: 'Создание компании', group: 'Мод. действия' },
  { value: 'assignment_override', label: 'Принудительное назначение', group: 'Мод. действия' },
  // --- Группа: лиды ---
  { value: 'lead_created', label: 'Создание лида', group: 'Лиды' },
  { value: 'lead_status_changed', label: 'Смена статуса лида', group: 'Лиды' },
  { value: 'dispute_opened', label: 'Открыт спор', group: 'Лиды' },
  { value: 'dispute_resolved', label: 'Спор разрешён', group: 'Лиды' },
  // --- Группа: вознаграждения ---
  { value: 'reward_confirmed', label: 'Выплата подтверждена', group: 'Вознаграждения' },
  { value: 'reward_proof_attached', label: 'Подтверждение выплаты', group: 'Вознаграждения' },
  { value: 'reward_overdue', label: 'Просроченное вознаграждение', group: 'Вознаграждения' },
];

// ─── Main component ───────────────────────────────────────────────────────────

const LIMIT = 50;

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (actionFilter) params.set('action', actionFilter);
      const res = await api.get<AuditResponse>(`/admin/audit?${params}`);
      setEntries(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки журнала');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { load(); }, [load]);

  function handleFilter(value: string) {
    setActionFilter(value);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Build grouped select options
  const groups = Array.from(
    new Set(FILTER_OPTIONS.slice(1).map((o) => o.group)),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Журнал аудита</h1>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">
              {total.toLocaleString('ru-RU')} {total === 1 ? 'событие' : total < 5 ? 'события' : 'событий'}
              {actionFilter ? ` · фильтр: ${ACTION_LABEL[actionFilter] ?? actionFilter}` : ''}
            </p>
          )}
        </div>

        {/* Filter */}
        <select
          value={actionFilter}
          onChange={(e) => handleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Все события</option>
          {groups.map((group) => (
            <optgroup key={group} label={group}>
              {FILTER_OPTIONS.filter((o) => o.value !== '' && (o as { group?: string }).group === group).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Загрузка...</div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            {actionFilter ? 'Нет событий по выбранному фильтру' : 'Журнал пуст'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap w-36">Дата/время</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Событие</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Кто</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Субъект</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => {
                  const meta = renderMeta(entry.action, entry.metadata);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      {/* Дата */}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap align-top">
                        {fmtDateTime(entry.created_at)}
                      </td>

                      {/* Событие */}
                      <td className="px-4 py-3 align-top">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${actionColor(entry.action)}`}>
                          {ACTION_LABEL[entry.action] ?? entry.action}
                        </span>
                      </td>

                      {/* Кто (актор) */}
                      <td className="px-4 py-3 align-top">
                        {entry.actor_name ? (
                          <Link
                            href={`/users/${entry.actor_id}`}
                            className="hover:underline"
                          >
                            <p className="text-xs font-medium text-gray-800 leading-snug">{entry.actor_name}</p>
                            {entry.actor_phone && (
                              <p className="text-xs text-gray-400 font-mono">{formatPhone(entry.actor_phone)}</p>
                            )}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">{shortId(entry.actor_id)}</span>
                        )}
                      </td>

                      {/* Субъект (entity) */}
                      <td className="px-4 py-3 align-top">
                        {entry.entity_type === 'user' ? (
                          <Link href={`/users/${entry.entity_id}`} className="hover:underline">
                            <p className="text-xs font-medium text-gray-800 leading-snug">
                              {entry.entity_name ?? shortId(entry.entity_id)}
                            </p>
                            <p className="text-xs text-gray-400">{ENTITY_TYPE_LABEL[entry.entity_type] ?? entry.entity_type}</p>
                          </Link>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-500">{ENTITY_TYPE_LABEL[entry.entity_type] ?? entry.entity_type}</p>
                            <p className="text-xs text-gray-400 font-mono">{shortId(entry.entity_id)}</p>
                          </div>
                        )}
                      </td>

                      {/* Детали */}
                      <td className="px-4 py-3 align-top max-w-xs">
                        {meta ? (
                          <p className="text-xs text-gray-600 leading-snug">{meta}</p>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Страница {page} из {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Назад
            </button>
            {/* Page number buttons — show up to 5 around current */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              return start + i;
            }).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={loading}
                className={`w-8 h-7 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 ${
                  p === page
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:border-gray-300 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Вперёд →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
