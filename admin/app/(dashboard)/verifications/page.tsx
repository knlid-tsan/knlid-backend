'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface VerificationUser {
  id: string;
  full_name: string;
  phone: string;
  specialization: string;
  city: string;
  updated_at: string;
  verification_attempts: number;
}

const SPEC_LABELS: Record<string, string> = {
  realtor: 'Риелтор',
  mortgage: 'Ипотечный брокер',
  lawyer: 'Юрист',
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

export default function VerificationsPage() {
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [listError, setListError] = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<VerificationUser | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');

  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await api.get<VerificationUser[]>('/moderation/verifications');
      setUsers(data);
    } catch (err) {
      setListError(
        err instanceof ApiError ? err.message : 'Не удалось загрузить очередь',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function openUser(user: VerificationUser) {
    setSelected(user);
    setDocUrl(null);
    setDocError('');
    setRejecting(false);
    setRejectReason('');
    setActionError('');
    setDocLoading(true);
    try {
      const blob = await api.getBlob(`/moderation/verifications/${user.id}/document`);
      setDocUrl(URL.createObjectURL(blob));
    } catch (err) {
      setDocError(
        err instanceof ApiError ? err.message : 'Не удалось загрузить документ',
      );
    } finally {
      setDocLoading(false);
    }
  }

  function closeModal() {
    if (docUrl) URL.revokeObjectURL(docUrl);
    setSelected(null);
    setDocUrl(null);
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleApprove() {
    if (!selected) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/moderation/verifications/${selected.id}/approve`);
      const id = selected.id;
      closeModal();
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('Верификация одобрена');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка при одобрении');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selected || !rejectReason.trim()) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/moderation/verifications/${selected.id}/reject`, {
        reason: rejectReason,
      });
      const id = selected.id;
      closeModal();
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('Верификация отклонена');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка при отклонении');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Очередь верификации</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Пользователи, ожидающие проверки документов
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Загрузка...
        </div>
      ) : listError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {listError}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Очередь пуста — нет пользователей со статусом «на верификации»
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Имя
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Телефон
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Специализация
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Город
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Дата подачи
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                  Попытки
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {user.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.phone}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {SPEC_LABELS[user.specialization] ?? user.specialization}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{user.city}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(user.updated_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.verification_attempts}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openUser(user)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm whitespace-nowrap"
                    >
                      Открыть →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">{selected.full_name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selected.phone} · {SPEC_LABELS[selected.specialization] ?? selected.specialization} · {selected.city}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4 mt-0.5"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Document viewer */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden min-h-[180px] flex items-center justify-center">
                {docLoading ? (
                  <span className="text-gray-400 text-sm">Загрузка документа...</span>
                ) : docError ? (
                  <span className="text-red-500 text-sm px-4 text-center">{docError}</span>
                ) : docUrl ? (
                  <img
                    src={docUrl}
                    alt="Документ пользователя"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                ) : null}
              </div>

              {actionError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {actionError}
                </p>
              )}

              {!rejecting ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? '...' : 'Одобрить'}
                  </button>
                  <button
                    onClick={() => setRejecting(true)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Отклонить
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Причина отклонения
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Укажите причину отклонения..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? '...' : 'Подтвердить отклонение'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejecting(false);
                        setRejectReason('');
                        setActionError('');
                      }}
                      disabled={actionLoading}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm rounded-lg px-4 py-3 shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  );
}
