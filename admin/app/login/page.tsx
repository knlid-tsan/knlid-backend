'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { setToken, decodeToken } from '@/lib/auth';

type Step = 'phone' | 'otp';

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
      await api.post('/auth/request-otp', { phone });
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
        { phone, code },
      );
      const payload = decodeToken(access_token);
      if (!payload || payload.role === 'user') {
        setError('Доступ только для модераторов и администраторов');
        return;
      }
      setToken(access_token);
      router.push('/verifications');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">KN.LID Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Вход в панель модератора</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 900 000 00 00"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1.5 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                Код смотрите в логах сервера (консоль бэкенда)
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Изменить номер
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
