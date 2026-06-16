'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'support';
  sender_id: string | null;
  text: string;
  created_at: string;
  is_read: boolean;
}

function formatMsgTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function CompanySupportPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<MessageRow[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        const data = await api.get<{ conversation: unknown; messages: MessageRow[] }>(
          '/support/conversation',
        );
        const existingIds = new Set(messagesRef.current.map((m) => m.id));
        const newMsgs = data.messages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return;
        const wasAtBottom = isAtBottom();
        const hasNewSupport = newMsgs.some((m) => m.sender_type === 'support');
        if (hasNewSupport) api.post('/support/read').catch(() => {});
        setMessages((prev) => [...prev, ...newMsgs]);
        if (wasAtBottom) scrollToBottom();
      } catch {
        // Silent
      }
    }, 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ conversation: unknown; messages: MessageRow[] }>(
        '/support/conversation',
      );
      setMessages(data.messages);
      api.post('/support/read').catch(() => {});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить чат');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

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
      const msg = await api.post<MessageRow>('/support/message', { text: trimmed });
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

  return (
    <>
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Поддержка</h1>
        <p className="text-sm text-muted mt-0.5">Диалог с командой KN.LID</p>
      </div>

      <div className="flex flex-col" style={{ height: 'calc(100vh - 13rem)' }}>
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-surface rounded-xl border border-divider shadow-sm p-4 space-y-3 min-h-0"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              Загрузка...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-brand">{error}</p>
              <button onClick={load} className="text-sm text-primary underline">
                Повторить
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              Напишите нам — мы поможем
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_type === 'user';
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-background text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn ? 'text-white/60 text-right' : 'text-muted'
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
            placeholder="Сообщение... (Enter — отправить, Shift+Enter — перенос)"
            className="flex-1 resize-none rounded-xl border border-divider px-4 py-2.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors min-h-[42px] max-h-32 overflow-y-auto bg-surface"
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
              <svg
                className="animate-spin w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
    </>
  );
}
