'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { setToken, decodeToken } from '@/lib/auth';
import { maskPhoneInput, stripPhone } from '@/lib/format';

type Mode = 'login' | 'register';
type LoginStep = 'phone' | 'otp' | 'pending';
type RegisterStep = 'form' | 'otp' | 'success';

interface City {
  id: string;
  name: string;
  is_active: boolean;
}

interface RegisterForm {
  name: string;
  city: string;
  phone: string;
  contactName: string;
  contactPhone: string;
  consent: boolean;
}

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
  const [mode, setMode] = useState<Mode>('login');

  // Login state
  const [loginStep, setLoginStep] = useState<LoginStep>('phone');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register state
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [regForm, setRegForm] = useState<RegisterForm>({
    name: '',
    city: '',
    phone: '',
    contactName: '',
    contactPhone: '',
    consent: false,
  });
  const [registerCode, setRegisterCode] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    fetch(`${base}/cities`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<City[]>;
      })
      .then((data) => setCities(data.filter((c) => c.is_active)))
      .catch(() => {});
  }, []);

  function switchMode(m: Mode) {
    setMode(m);
    setLoginStep('phone');
    setLoginPhone('');
    setLoginCode('');
    setLoginError('');
    setRegisterStep('form');
    setRegForm({ name: '', city: '', phone: '', contactName: '', contactPhone: '', consent: false });
    setRegisterCode('');
    setRegisterError('');
  }

  // ── Login handlers ─────────────────────────────────────────────────────────

  async function handleLoginRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await api.post('/auth/request-otp', { phone: stripPhone(loginPhone) });
      setLoginStep('otp');
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Ошибка отправки кода');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLoginVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const { access_token } = await api.post<{ access_token: string }>(
        '/auth/verify-otp',
        { phone: stripPhone(loginPhone), code: loginCode },
      );
      const payload = decodeToken(access_token);
      if (!payload || !['admin', 'moderator', 'company'].includes(payload.role)) {
        setLoginError('Нет доступа к панели');
        return;
      }
      setToken(access_token);
      if (payload.role === 'company') {
        // Check company status before redirecting
        try {
          const company = await api.get<{ status: string }>('/companies/me');
          if (company.status === 'new' || company.status === 'pending') {
            setLoginStep('pending');
            return;
          }
        } catch {
          // If we can't fetch company, still redirect
        }
        router.push('/company/applications');
      } else {
        router.push('/verifications');
      }
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Неверный код');
    } finally {
      setLoginLoading(false);
    }
  }

  // ── Register handlers ──────────────────────────────────────────────────────

  async function handleRegisterRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError('');

    if (!regForm.name.trim()) { setRegisterError('Введите название компании'); return; }
    if (!regForm.city) { setRegisterError('Выберите город'); return; }
    if (!regForm.contactName.trim()) { setRegisterError('Введите ФИ контактного лица'); return; }
    if (!regForm.contactPhone.trim()) { setRegisterError('Введите телефон контактного лица'); return; }
    if (!regForm.consent) { setRegisterError('Необходимо согласиться с условиями'); return; }

    const phone = stripPhone(regForm.phone);
    if (!/^\+7\d{10}$/.test(phone)) {
      setRegisterError('Телефон компании должен быть в формате +7XXXXXXXXXX');
      return;
    }

    setRegisterLoading(true);
    try {
      await api.post('/auth/request-otp', { phone });
      setRegisterStep('otp');
    } catch (err) {
      setRegisterError(err instanceof ApiError ? err.message : 'Ошибка отправки кода');
    } finally {
      setRegisterLoading(false);
    }
  }

  async function handleRegisterConfirm(e: React.FormEvent) {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);
    try {
      await api.post('/companies/register', {
        name: regForm.name.trim(),
        city: regForm.city.trim(),
        phone: stripPhone(regForm.phone),
        contactName: regForm.contactName.trim(),
        contactPhone: stripPhone(regForm.contactPhone),
        code: registerCode,
      });
      setRegisterStep('success');
    } catch (err) {
      setRegisterError(err instanceof ApiError ? err.message : 'Ошибка регистрации');
    } finally {
      setRegisterLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface rounded-xl shadow-sm border border-divider p-8 w-full max-w-sm">
        <div className="mb-6">
          <KnLidLogo />
          <p className="text-[10px] font-medium text-muted tracking-[2.5px] uppercase mt-2">
            Передача лидов между специалистами
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'register'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Зарегистрироваться
          </button>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <>
            {loginStep === 'phone' && (
              <form onSubmit={handleLoginRequestOtp} className="space-y-4">
                <p className="text-sm text-muted">Вход в панель управления</p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Номер телефона
                  </label>
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(maskPhoneInput(e.target.value))}
                    placeholder="+7 700 000 00 00"
                    required
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                {loginError && <p className="text-sm text-brand">{loginError}</p>}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loginLoading ? 'Отправка...' : 'Получить код'}
                </button>
              </form>
            )}

            {loginStep === 'otp' && (
              <form onSubmit={handleLoginVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Код подтверждения
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted mt-1.5 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                    Код смотрите в логах сервера (консоль бэкенда)
                  </p>
                </div>
                {loginError && <p className="text-sm text-brand">{loginError}</p>}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loginLoading ? 'Проверка...' : 'Войти'}
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginStep('phone'); setLoginCode(''); setLoginError(''); }}
                  className="w-full text-sm text-muted hover:text-foreground transition-colors"
                >
                  ← Изменить номер
                </button>
              </form>
            )}

            {loginStep === 'pending' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">Заявка на рассмотрении</p>
                  <p>Ваша компания ещё не проверена администратором. После одобрения вы сможете войти в кабинет.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setLoginStep('phone'); setLoginCode(''); setLoginError(''); }}
                  className="w-full text-sm text-muted hover:text-foreground transition-colors"
                >
                  ← Войти с другим номером
                </button>
              </div>
            )}
          </>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <>
            {registerStep === 'form' && (
              <form onSubmit={handleRegisterRequestOtp} className="space-y-3">
                <p className="text-sm text-muted mb-1">Регистрация компании-гаранта</p>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Название компании
                  </label>
                  <input
                    type="text"
                    value={regForm.name}
                    onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="ТОО «Алматы Гарант»"
                    required
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Город
                  </label>
                  {cities.length > 0 ? (
                    <select
                      value={regForm.city}
                      onChange={(e) => setRegForm((f) => ({ ...f, city: e.target.value }))}
                      required
                      className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    >
                      <option value="">Выберите город</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={regForm.city}
                      onChange={(e) => setRegForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="Алматы"
                      required
                      className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Телефон компании
                  </label>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => setRegForm((f) => ({ ...f, phone: maskPhoneInput(e.target.value) }))}
                    placeholder="+7 771 000 00 00"
                    required
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted mt-1">На этот номер придёт код подтверждения</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Контактное лицо (ФИ)
                  </label>
                  <input
                    type="text"
                    value={regForm.contactName}
                    onChange={(e) => setRegForm((f) => ({ ...f, contactName: e.target.value }))}
                    placeholder="Айдос Серіков"
                    required
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Телефон контактного лица
                  </label>
                  <input
                    type="tel"
                    value={regForm.contactPhone}
                    onChange={(e) => setRegForm((f) => ({ ...f, contactPhone: maskPhoneInput(e.target.value) }))}
                    placeholder="+7 778 000 00 00"
                    required
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={regForm.consent}
                    onChange={(e) => setRegForm((f) => ({ ...f, consent: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="consent" className="text-xs text-muted leading-relaxed">
                    Я принимаю{' '}
                    <a
                      href="https://lid.kn.kz/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      условия использования
                    </a>{' '}
                    и{' '}
                    <a
                      href="https://lid.kn.kz/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      политику конфиденциальности
                    </a>
                  </label>
                </div>

                {registerError && <p className="text-sm text-brand">{registerError}</p>}

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {registerLoading ? 'Отправка кода...' : 'Получить код'}
                </button>
              </form>
            )}

            {registerStep === 'otp' && (
              <form onSubmit={handleRegisterConfirm} className="space-y-4">
                <p className="text-sm text-muted">
                  Код отправлен на номер{' '}
                  <span className="font-medium text-foreground">{regForm.phone}</span>
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Код подтверждения
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={registerCode}
                    onChange={(e) => setRegisterCode(e.target.value)}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full border border-divider rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted mt-1.5 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                    Код смотрите в логах сервера (консоль бэкенда)
                  </p>
                </div>
                {registerError && <p className="text-sm text-brand">{registerError}</p>}
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {registerLoading ? 'Регистрация...' : 'Подтвердить и зарегистрироваться'}
                </button>
                <button
                  type="button"
                  onClick={() => { setRegisterStep('form'); setRegisterCode(''); setRegisterError(''); }}
                  className="w-full text-sm text-muted hover:text-foreground transition-colors"
                >
                  ← Изменить данные
                </button>
              </form>
            )}

            {registerStep === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                  <p className="font-medium mb-1">Заявка отправлена</p>
                  <p>
                    После проверки администратором вы сможете войти по номеру телефона компании.
                    Мы свяжемся с вашим контактным лицом.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full bg-primary text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Войти
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
