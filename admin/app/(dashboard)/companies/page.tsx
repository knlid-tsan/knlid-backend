'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatPhone, maskPhoneInput, stripPhone } from '@/lib/format';

interface Company {
  id: string;
  name: string;
  bin: string | null;
  phone: string;
  city: string;
  status: string;
  contact_name: string | null;
  contact_phone: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface City {
  id: string;
  name: string;
}

const STATUS_TABS = [
  { value: 'new', label: 'Новые' },
  { value: 'pending', label: 'Ожидают' },
  { value: 'active', label: 'Активные' },
  { value: 'rejected', label: 'Отклонённые' },
  { value: 'blocked', label: 'Заблокированные' },
  { value: '', label: 'Все' },
] as const;

const STATUS_LABEL: Record<string, string> = {
  new: 'Новая',
  pending: 'На рассмотрении',
  active: 'Активна',
  rejected: 'Отклонена',
  blocked: 'Заблокирована',
};

const STATUS_CLASS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-gray-200 text-gray-600',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_CLASS[status] ?? 'bg-gray-100 text-gray-600'
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function CompaniesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<string>('new');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError('');
    try {
      const params = status ? `?status=${status}` : '';
      const data = await api.get<Company[]>(`/moderation/companies${params}`);
      setCompanies(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить список компаний');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function openCreate() {
    setShowCreate(true);
    setFormName('');
    setFormPhone('');
    setFormCity('');
    setFormError('');
    setCreateSuccess(null);
    if (cities.length === 0) {
      try {
        const data = await api.get<City[]>('/cities');
        setCities(data);
      } catch {
        // cities will be empty, user can type manually
      }
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const phone = stripPhone(formPhone);
    if (!formName.trim()) { setFormError('Введите название'); return; }
    if (phone.length < 10) { setFormError('Введите корректный номер'); return; }
    if (!formCity) { setFormError('Выберите город'); return; }

    setFormLoading(true);
    try {
      const result = await api.post<{ company: Company; representative_id: string }>(
        '/admin/companies',
        { name: formName.trim(), phone, city: formCity },
      );
      setCreateSuccess(`Компания «${result.company.name}» создана. Представитель входит по номеру ${formatPhone(phone)}`);
      // Switch to active tab and reload
      setTab('active');
      await load('active');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Не удалось создать компанию');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Компании</h1>
          <p className="text-sm text-gray-500 mt-0.5">Модерация компаний-гарантов</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          + Создать компанию
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.value
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Название</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">БИН</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Город</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Телефон</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Дата заявки</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              : companies.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                    Компаний с таким статусом нет
                  </td>
                </tr>
              )
              : companies.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/companies/${c.id}`)}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">{c.name}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs tracking-wide">{c.bin ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.city}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs">{formatPhone(c.phone)}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(c.created_at)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Create company modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Создать компанию</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>

            {createSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                  {createSuccess}
                </div>
                <p className="text-sm text-gray-500">
                  Представитель компании может войти в кабинет на этом сайте (:3001) по указанному номеру телефона.
                </p>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-full px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Готово
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название компании
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ООО «Гарант Недвижимость»"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон представителя
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(maskPhoneInput(e.target.value))}
                    placeholder="+7 700 000 00 00"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">По этому номеру представитель будет входить в кабинет</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Город
                  </label>
                  {cities.length > 0 ? (
                    <select
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-white"
                    >
                      <option value="">Выберите город</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="Алматы"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  )}
                </div>

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    {formLoading ? 'Создание...' : 'Создать'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
