'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { getToken, decodeToken } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UserDetail {
  id: string;
  full_name: string;
  phone: string;
  specialization: string;
  city: string;
  status: string;
  role: string;
  rating: string;
  verification_rejection_reason: string | null;
  verification_attempts: number;
  verification_blocked_until: string | null;
  language: string;
  created_at: string;
  updated_at: string;
  stats: { leads_created: number; leads_assigned: number; leads_closed: number };
  recent_actions: AuditEntry[];
}

// ─── Dictionaries ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  new: 'Новый', pending: 'На верификации', active: 'Активен', blocked: 'Заблокирован',
};
const STATUS_CLASS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};
const ROLE_LABEL: Record<string, string> = {
  user: 'Специалист', moderator: 'Модератор', admin: 'Администратор',
};
const ROLE_CLASS: Record<string, string> = {
  user: 'bg-slate-100 text-slate-600',
  moderator: 'bg-blue-100 text-blue-700',
  admin: 'bg-violet-100 text-violet-700',
};
const SPEC_LABEL: Record<string, string> = {
  realtor: 'Риелтор', mortgage: 'Ипотечный брокер', lawyer: 'Юрист',
};
const ACTION_LABEL: Record<string, string> = {
  user_registered: 'Регистрация',
  lead_created: 'Создан лид',
  lead_assigned: 'Лид назначен',
  lead_accepted: 'Лид принят',
  lead_declined: 'Лид отклонён',
  lead_status_changed: 'Смена статуса лида',
  view_client_phone: 'Просмотр телефона клиента',
  reward_created: 'Создано вознаграждение',
  reward_paid: 'Вознаграждение выплачено',
  reward_disputed: 'Вознаграждение оспорено',
  dispute_opened: 'Открыт спор',
  dispute_resolved: 'Спор разрешён',
  document_uploaded: 'Загружен документ',
  verification_approved: 'Верификация одобрена',
  verification_rejected: 'Верификация отклонена',
  tariff_upsert: 'Тариф изменён',
  tariff_delete: 'Тариф удалён',
  user_blocked: 'Пользователь заблокирован',
  user_unblocked: 'Пользователь разблокирован',
  user_role_changed: 'Роль изменена',
  user_reverification_requested: 'Запрошена повторная верификация',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // Current session info
  const [myId, setMyId] = useState('');
  const [myRole, setMyRole] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmReverif, setConfirmReverif] = useState(false);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const payload = decodeToken(token);
    if (payload) {
      setMyId(payload.sub);
      setMyRole(payload.role);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setDataError('');
    try {
      const data = await api.get<UserDetail>(`/admin/users/${id}`);
      setUser(data);
      setSelectedRole(data.role);
    } catch (err) {
      setDataError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function doAction(fn: () => Promise<void>) {
    setActionLoading(true);
    setActionError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка выполнения действия');
    } finally {
      setActionLoading(false);
    }
  }

  function handleBlock() {
    doAction(async () => {
      await api.post(`/admin/users/${id}/block`);
      setConfirmBlock(false);
    });
  }

  function handleUnblock() {
    doAction(() => api.post(`/admin/users/${id}/unblock`));
  }

  function handleReverification() {
    doAction(async () => {
      await api.post(`/admin/users/${id}/request-reverification`);
      setConfirmReverif(false);
    });
  }

  function handleRoleChange() {
    if (!selectedRole || selectedRole === user?.role) return;
    doAction(async () => {
      await api.post(`/admin/users/${id}/role`, { role: selectedRole });
      setRoleSelectOpen(false);
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isSelf = myId && user ? myId === user.id : false;
  const isAdmin = myRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Загрузка...</div>
    );
  }

  if (dataError || !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        {dataError || 'Пользователь не найден'}
      </div>
    );
  }

  return (
    <>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        ← Назад к списку
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{user.full_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge label={STATUS_LABEL[user.status] ?? user.status} cls={STATUS_CLASS[user.status] ?? ''} />
            <Badge label={ROLE_LABEL[user.role] ?? user.role} cls={ROLE_CLASS[user.role] ?? ''} />
            <span className="text-xs text-gray-400">{SPEC_LABEL[user.specialization] ?? user.specialization}</span>
          </div>
        </div>
        {Number(user.rating) > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">★ {Number(user.rating).toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-0.5">рейтинг</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: user info */}
        <div className="col-span-2 space-y-5">

          {/* Details card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Данные
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-400 text-xs">Телефон</dt>
                <dd className="font-mono text-gray-900 mt-0.5">{user.phone}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Город</dt>
                <dd className="text-gray-900 mt-0.5">{user.city}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Дата регистрации</dt>
                <dd className="text-gray-900 mt-0.5">{fmtDate(user.created_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Последнее обновление</dt>
                <dd className="text-gray-900 mt-0.5">{fmtDate(user.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Попыток верификации</dt>
                <dd className="text-gray-900 mt-0.5">{user.verification_attempts}</dd>
              </div>
              {user.verification_blocked_until && (
                <div>
                  <dt className="text-gray-400 text-xs">Верификация заблокирована до</dt>
                  <dd className="text-red-600 mt-0.5">{fmtDateTime(user.verification_blocked_until)}</dd>
                </div>
              )}
              {user.verification_rejection_reason && (
                <div className="col-span-2">
                  <dt className="text-gray-400 text-xs">Причина отказа верификации</dt>
                  <dd className="text-gray-900 mt-0.5">{user.verification_rejection_reason}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Статистика лидов
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Создано лидов" value={user.stats.leads_created} />
              <StatCard label="Назначено как исполнитель" value={user.stats.leads_assigned} />
              <StatCard label="Успешно закрыто" value={user.stats.leads_closed} />
            </div>
          </div>

          {/* Audit log */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Последние действия
            </h2>
            {user.recent_actions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Действий не найдено</p>
            ) : (
              <div className="space-y-2">
                {user.recent_actions.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-800">
                        {ACTION_LABEL[entry.action] ?? entry.action}
                      </span>
                      {entry.actor_id !== user.id && (
                        <span className="ml-1.5 text-xs text-gray-400">(действие над пользователем)</span>
                      )}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {Object.entries(entry.metadata)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {fmtDateTime(entry.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Действия
            </h2>

            {actionError && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                {actionError}
              </div>
            )}

            {isSelf ? (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                Это ваш аккаунт — управление недоступно
              </p>
            ) : (
              <div className="space-y-3">
                {/* Block / Unblock */}
                {user.status !== 'blocked' ? (
                  confirmBlock ? (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                      <p className="text-xs text-red-700">Заблокировать пользователя?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleBlock}
                          disabled={actionLoading}
                          className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading ? '...' : 'Заблокировать'}
                        </button>
                        <button
                          onClick={() => setConfirmBlock(false)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmBlock(true)}
                      disabled={actionLoading}
                      className="w-full text-sm font-medium text-red-600 hover:text-red-800 border border-red-200 hover:border-red-300 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                    >
                      Заблокировать
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleUnblock}
                    disabled={actionLoading}
                    className="w-full text-sm font-medium text-green-700 hover:text-green-900 border border-green-200 hover:border-green-300 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Сохранение...' : 'Разблокировать'}
                  </button>
                )}

                {/* Request reverification */}
                {confirmReverif ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                    <p className="text-xs text-amber-700">
                      Сбросить верификацию?{user.status === 'active' ? ' Статус вернётся к «Новый».' : ''}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleReverification}
                        disabled={actionLoading}
                        className="text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading ? '...' : 'Подтвердить'}
                      </button>
                      <button onClick={() => setConfirmReverif(false)} className="text-xs text-gray-500 hover:text-gray-700">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReverif(true)}
                    disabled={actionLoading}
                    className="w-full text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                  >
                    Запросить повторную верификацию
                  </button>
                )}

                {/* Role change — admin only */}
                {isAdmin && (
                  roleSelectOpen ? (
                    <div className="rounded-lg border border-gray-200 p-3 space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Сменить роль</p>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      >
                        <option value="user">Специалист</option>
                        <option value="moderator">Модератор</option>
                        <option value="admin">Администратор</option>
                      </select>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleRoleChange}
                          disabled={actionLoading || selectedRole === user.role}
                          className="text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading ? '...' : 'Сохранить'}
                        </button>
                        <button
                          onClick={() => { setRoleSelectOpen(false); setSelectedRole(user.role); }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRoleSelectOpen(true)}
                      disabled={actionLoading}
                      className="w-full text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                    >
                      Сменить роль
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Quick info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">ID</h2>
            <p className="font-mono text-xs text-gray-400 break-all">{user.id}</p>
          </div>
        </div>
      </div>
    </>
  );
}
