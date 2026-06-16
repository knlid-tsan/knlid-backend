'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { setToken, decodeToken } from '@/lib/auth';
import { maskPhoneInput, stripPhone } from '@/lib/format';

type Step = 'phone' | 'otp';

function KnLidLogo() {
  return (
    <div className="flex items-center">
      <span className="text-[42px] font-bold text-brand tracking-[-2px] leading-none">kn</span>
      <span className="mx-1 w-[18px] h-[18px] rounded-full bg-brand flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      </span>
      <span className="text-[42px] font-bold text-brand tracking-[-2px] leading-none">lid</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { phone: stripPhone(phone) });
      setStep('otp');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await api.post<{ access_token: string }>(
        '/auth/verify-otp',
        { phone: stripPhone(phone), code },
      );
      const payload = decodeToken(access_token);
      if (!payload || !['admin', 'moderator', 'company'].includes(payload.role)) {
        setError('Нет доступа к панели');
        return;
      }
      setToken(access_token);
      // company → own cabinet; admin/moderator → moderation section
      router.push(payload.role === 'company' ? '/company/applications' : '/verifications');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface rounded-xl shadow-sm border border-divider p-8 w-full max-w-sm">
        <div className="mb-8">
          <KnLidLogo />
          <p className="text-[10px] font-medium text-muted tracking-[2.5px] uppercase mt-2">
            Передача лидов между специалистами
          </p>
          <p className="text-sm text-muted mt-4">Вход в панель управления</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(maskPhoneInput(e.target.value))}
                placeholder="+7 700 000 00 00"
                required
                className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            {error && <p className="text-sm text-brand">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Код подтверждения
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                autoFocus
                className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted mt-1.5 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                Код смотрите в логах сервера (консоль бэкенда)
              </p>
            </div>
            {error && <p className="text-sm text-brand">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Проверка...' : 'Войти'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setCode('');
                setError('');
              }}
              className="w-full text-sm text-muted hover:text-foreground transition-colors"
            >
              ← Изменить номер
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
