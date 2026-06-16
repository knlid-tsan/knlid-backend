'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatPhone } from '@/lib/format';

interface ConversationRow {
  id: string;
  last_message_at: string;
  unread_for_support: number;
  created_at: string;
  user_id: string;
  user_full_name: string;
  user_phone: string;
  user_role: string;
  last_message_text: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Специалист',
  company: 'Компания',
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  }
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function SupportPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<ConversationRow[]>('/support/admin/conversations');
      setConversations(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить диалоги');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Поддержка</h1>
        <p className="text-sm text-gray-500 mt-0.5">Диалоги пользователей с поддержкой</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Загрузка...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : conversations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Диалогов пока нет
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Последнее сообщение</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Время</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {conversations.map((c) => {
                const hasUnread = c.unread_for_support > 0;
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/support/${c.id}`)}
                    className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${
                      hasUnread ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {hasUnread && (
                          <div className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />
                        )}
                        <div>
                          <p className={`${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                            {c.user_full_name || '—'}
                          </p>
                          <p className="text-xs text-gray-400">{formatPhone(c.user_phone)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                        {ROLE_LABELS[c.user_role] ?? c.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className={`line-clamp-1 ${hasUnread ? 'text-gray-800' : 'text-gray-500'}`}>
                          {c.last_message_text ?? 'Нет сообщений'}
                        </span>
                        {hasUnread && (
                          <span className="flex-shrink-0 bg-brand text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                            {c.unread_for_support > 99 ? '99+' : c.unread_for_support}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-right text-xs">
                      {formatRelativeTime(c.last_message_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
