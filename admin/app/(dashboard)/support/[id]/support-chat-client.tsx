'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { formatPhone } from '@/lib/format';

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'support';
  sender_id: string | null;
  text: string;
  created_at: string;
  is_read: boolean;
}

interface ConversationInfo {
  id: string;
  user_id: string;
  user_full_name: string;
  user_phone: string;
  user_role: string;
  last_message_at: string;
  unread_for_support: number;
  unread_for_user: number;
  created_at: string;
}

interface ConversationDetail {
  conversation: ConversationInfo;
  messages: MessageRow[];
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Специалист',
  company: 'Компания',
};

function formatMsgTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function SupportChatClient({ id }: { id: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<MessageRow[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [data, setData] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const isAtBottom = () => {
    const el = scrollRef.current;
    return !el || el.scrollTop >= el.scrollHeight - el.clientHeight - 80;
  };

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const detail = await api.get<ConversationDetail>(`/support/admin/conversations/${id}`);
        const existingIds = new Set(messagesRef.current.map((m) => m.id));
        const newMsgs = detail.messages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return;
        const wasAtBottom = isAtBottom();
        const hasNewUser = newMsgs.some((m) => m.sender_type === 'user');
        if (hasNewUser) api.post(`/support/admin/conversations/${id}/read`).catch(() => {});
        setMessages((prev) => [...prev, ...newMsgs]);
        if (wasAtBottom) scrollToBottom();
      } catch {
        // Silent
      }
    }, 3500);
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const detail = await api.get<ConversationDetail>(`/support/admin/conversations/${id}`);
      setData(detail);
      setMessages(detail.messages);
      // Mark as read silently
      api.post(`/support/admin/conversations/${id}/read`).catch(() => {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить диалог');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Keep ref in sync for poll closure (avoids stale state)
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Initial load → start polling; cleanup on unmount
  useEffect(() => {
    let active = true;
    load().finally(() => { if (active) startPolling(); });
    return () => {
      active = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load, startPolling]);

  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom();
  }, [loading, messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await api.post<MessageRow>(
        `/support/admin/conversations/${id}/message`,
        { text: trimmed },
      );
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const info = data?.conversation;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link
          href="/support"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Назад к списку"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">
            {info?.user_full_name || '—'}
          </h1>
          <p className="text-xs text-gray-400">
            {formatPhone(info?.user_phone ?? '')}
            {info?.user_role && (
              <span className="ml-2 text-gray-300">·</span>
            )}
            {info?.user_role && (
              <span className="ml-2">{ROLE_LABELS[info.user_role] ?? info.user_role}</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Нет сообщений
          </div>
        ) : (
          messages.map((msg) => {
            const isSupport = msg.sender_type === 'support';
            return (
              <div
                key={msg.id}
                className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isSupport
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isSupport ? 'text-white/60 text-right' : 'text-gray-400'
                    }`}
                  >
                    {formatMsgTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ответ пользователю... (Enter — отправить, Shift+Enter — перенос)"
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[42px] max-h-32 overflow-y-auto"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Отправить"
        >
          {sending ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" className="opacity-75" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
