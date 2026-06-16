'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatPhone, maskPhoneInput, stripPhone } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  full_name: string;
  phone: string;
  specialization: string;
  city: string;
  status: string;
  role: string;
  rating: string;
  created_at: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

interface City {
  id: string;
  name: string;
}

const SPEC_OPTIONS = [
  { value: 'realtor', label: 'Риелтор' },
  { value: 'mortgage', label: 'Ипотечный брокер' },
  { value: 'lawyer', label: 'Юрист' },
] as const;

// ─── Dictionaries ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  new: 'Новый',
  pending: 'На верификации',
  active: 'Активен',
  blocked: 'Заблокирован',
};

const STATUS_CLASS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const ROLE_LABEL: Record<string, string> = {
  user: 'Специалист',
  moderator: 'Модератор',
  admin: 'Администратор',
};

const ROLE_CLASS: Record<string, string> = {
  user: 'bg-slate-100 text-slate-600',
  moderator: 'bg-blue-100 text-blue-700',
  admin: 'bg-violet-100 text-violet-700',
};

const SPEC_LABEL: Record<string, string> = {
  realtor: 'Риелтор',
  mortgage: 'Ипотечный брокер',
  lawyer: 'Юрист',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const LIMIT = 20;

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // Create specialist modal
  const [showCreate, setShowCreate] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSpec, setFormSpec] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [createToast, setCreateToast] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: number, q: string, st: string, sp: string, ro: string, ci: string) => {
    setLoading(true);
    setDataError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (q) params.set('search', q);
      if (st) params.set('status', st);
      if (sp) params.set('specialization', sp);
      if (ro) params.set('role', ro);
      if (ci) params.set('city', ci);
      const res = await api.get<UsersResponse>(`/admin/users?${params}`);
      setUsers(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setDataError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, search, filterStatus, filterSpec, filterRole, filterCity);
  }, [search, filterStatus, filterSpec, filterRole, filterCity, load]);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 400);
  }

  function goPage(p: number) {
    load(p, search, filterStatus, filterSpec, filterRole, filterCity);
  }

  const totalPages = Math.ceil(total / LIMIT);

  async function openCreate() {
    setShowCreate(true);
    setFormName(''); setFormPhone(''); setFormSpec(''); setFormCity('');
    setFormError(''); setCreateToast('');
    if (cities.length === 0) {
      try { setCities(await api.get<City[]>('/cities')); } catch { /* fallback to text input */ }
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const phone = stripPhone(formPhone);
    if (!formName.trim()) { setFormError('Введите ФИО'); return; }
    if (phone.length < 10) { setFormError('Введите корректный номер'); return; }
    if (!formSpec) { setFormError('Выберите специализацию'); return; }
    if (!formCity) { setFormError('Выберите город'); return; }

    setFormLoading(true);
    try {
      const user = await api.post<{ full_name: string }>('/admin/specialists', {
        full_name: formName.trim(), phone, specialization: formSpec, city: formCity,
      });
      setShowCreate(false);
      setCreateToast(`Специалист ${user.full_name} создан и верифицирован`);
      setTimeout(() => setCreateToast(''), 4000);
      load(1, search, filterStatus, filterSpec, filterRole, filterCity);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Не удалось создать специалиста');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>
          <p className="text-sm text-gray-500 mt-0.5">Управление специалистами платформы</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          + Создать специалиста
        </button>
      </div>

      {createToast && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 mb-4">
          {createToast}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Поиск по имени или телефону..."
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-56"
        />
        <input
          type="text"
          value={filterCity}
          onChange={(e) => { setFilterCity(e.target.value); }}
          placeholder="Город..."
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-36"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Все статусы</option>
          <option value="new">Новый</option>
          <option value="pending">На верификации</option>
          <option value="active">Активен</option>
          <option value="blocked">Заблокирован</option>
        </select>
        <select
          value={filterSpec}
          onChange={(e) => setFilterSpec(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Все специализации</option>
          <option value="realtor">Риелтор</option>
          <option value="mortgage">Ипотечный брокер</option>
          <option value="lawyer">Юрист</option>
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">Все роли</option>
          <option value="user">Специалист</option>
          <option value="moderator">Модератор</option>
          <option value="admin">Администратор</option>
        </select>
        {(search || filterStatus || filterSpec || filterRole || filterCity) && (
          <button
            onClick={() => {
              setSearchInput(''); setSearch('');
              setFilterStatus(''); setFilterSpec(''); setFilterRole(''); setFilterCity('');
            }}
            className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {dataError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
          {dataError}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-left px-5 py-3 font-medium text-gray-500">Имя</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Телефон</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Специализация</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Город</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Роль</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Рейтинг</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Регистрация</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded w-4/5" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.length === 0
              ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                    {search || filterStatus || filterSpec || filterRole || filterCity
                      ? 'Пользователи по заданным фильтрам не найдены'
                      : 'Пользователей пока нет'}
                  </td>
                </tr>
              )
              : users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/users/${u.id}`)}
                    className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 text-xs tracking-wide">{formatPhone(u.phone)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{SPEC_LABEL[u.specialization] ?? u.specialization}</td>
                    <td className="px-5 py-3.5 text-gray-600">{u.city}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={STATUS_LABEL[u.status] ?? u.status} cls={STATUS_CLASS[u.status] ?? 'bg-gray-100 text-gray-600'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={ROLE_LABEL[u.role] ?? u.role} cls={ROLE_CLASS[u.role] ?? 'bg-gray-100 text-gray-600'} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {Number(u.rating) > 0 ? `★ ${Number(u.rating).toFixed(1)}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Показано {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} из {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p as number)}
                    className={`px-3 py-1.5 rounded-lg border transition-colors ${
                      p === page ? 'bg-slate-800 text-white border-slate-800' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >{p}</button>
                )
              )}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >→</button>
          </div>
        </div>
      )}
      {!loading && totalPages <= 1 && total > 0 && (
        <p className="mt-3 text-xs text-gray-400">{total} пользовател{total === 1 ? 'ь' : total < 5 ? 'я' : 'ей'}</p>
      )}

      {/* Create specialist modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Создать специалиста</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(maskPhoneInput(e.target.value))}
                  placeholder="+7 700 000 00 00"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <p className="text-xs text-gray-400 mt-1">По этому номеру специалист будет входить в приложение</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Специализация</label>
                <select
                  value={formSpec}
                  onChange={(e) => setFormSpec(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
                >
                  <option value="">Выберите специализацию</option>
                  {SPEC_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                {cities.length > 0 ? (
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
                  >
                    <option value="">Выберите город</option>
                    {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Алматы"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                )}
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Специалист будет создан с верификацией вручную (без загрузки документа) и сразу получит статус «Активен».
              </p>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
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
          </div>
        </div>
      )}
    </>
  );
}
