'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { getToken, decodeToken } from '@/lib/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tariff {
  id: string;
  lead_type: string;
  city: string | null;
  method: 'percent' | 'fixed';
  value: string;
}

interface City {
  id: string;
  name: string;
  is_active: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAD_TYPES = ['buyer', 'owner', 'mortgage', 'legal'] as const;
type LeadType = (typeof LEAD_TYPES)[number];

const TYPE_LABELS: Record<string, string> = {
  buyer: 'Покупатель',
  owner: 'Собственник',
  mortgage: 'Ипотека',
  legal: 'Юрист',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtValue(method: string, value: string) {
  const n = Number(value);
  return method === 'percent'
    ? `${n}%`
    : `${n.toLocaleString('ru-RU')} ₸`;
}

function validateFormValue(method: 'percent' | 'fixed', raw: string): string {
  const n = Number(raw);
  if (!raw.trim() || isNaN(n) || n <= 0) return 'Введите значение больше 0';
  if (method === 'percent' && n > 100) return 'Процент не может превышать 100';
  return '';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MethodToggle({
  value,
  onChange,
}: {
  value: 'percent' | 'fixed';
  onChange: (v: 'percent' | 'fixed') => void;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
      {(['percent', 'fixed'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${
            value === m
              ? 'bg-slate-800 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {m === 'percent' ? 'Процент' : 'Фиксированная'}
        </button>
      ))}
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white text-sm rounded-xl px-4 py-3 shadow-lg">
      {message}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ModalMode = 'editBase' | 'addOverride';

export default function TariffsPage() {
  const router = useRouter();

  // Auth / role
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Data
  const [baseTariffs, setBaseTariffs] = useState<Tariff[]>([]);
  const [overrides, setOverrides] = useState<Tariff[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Delete confirm
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('editBase');
  const [fixedLeadType, setFixedLeadType] = useState<string>('buyer');

  // Form
  const [formLeadType, setFormLeadType] = useState<string>('buyer');
  const [formCity, setFormCity] = useState<string>('');
  const [formMethod, setFormMethod] = useState<'percent' | 'fixed'>('percent');
  const [formValue, setFormValue] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Role check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    const payload = decodeToken(token);
    if (!payload) { router.replace('/login'); return; }
    setIsAdmin(payload.role === 'admin');
  }, [router]);

  // ── Load data ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setDataError('');
    try {
      const [tariffsData, citiesData] = await Promise.all([
        api.get<{ base: Tariff[]; overrides: Tariff[] }>('/admin/tariffs'),
        api.get<City[]>('/cities'),
      ]);
      setBaseTariffs(tariffsData.base);
      setOverrides(tariffsData.overrides);
      setCities(citiesData);
    } catch (err) {
      setDataError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin === true) load();
  }, [isAdmin, load]);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Modal open helpers ────────────────────────────────────────────────────────
  function openEditBase(leadType: string) {
    const existing = baseTariffs.find((t) => t.lead_type === leadType);
    setModalMode('editBase');
    setFixedLeadType(leadType);
    setFormLeadType(leadType);
    setFormCity('');
    setFormMethod(existing?.method ?? 'percent');
    setFormValue(existing ? String(Number(existing.value)) : '');
    setFormError('');
    setModalOpen(true);
  }

  function openAddOverride() {
    setModalMode('addOverride');
    setFixedLeadType('');
    setFormLeadType('buyer');
    setFormCity(cities[0]?.name ?? '');
    setFormMethod('percent');
    setFormValue('');
    setFormError('');
    setModalOpen(true);
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const err = validateFormValue(formMethod, formValue);
    if (err) { setFormError(err); return; }
    if (modalMode === 'addOverride' && !formCity) {
      setFormError('Выберите город');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const body: Record<string, unknown> = {
        lead_type: formLeadType,
        method: formMethod,
        value: Number(formValue),
      };
      if (modalMode === 'addOverride') body.city = formCity;

      await api.put('/admin/tariffs', body);
      setModalOpen(false);
      await load();
      showToast(modalMode === 'editBase' ? 'Базовый тариф сохранён' : 'Городское исключение добавлено');
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.delete(`/admin/tariffs/${id}`);
      setPendingDeleteId(null);
      await load();
      showToast('Городское исключение удалено');
    } catch (e) {
      setPendingDeleteId(null);
      showToast(e instanceof ApiError ? e.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  }

  // ── Access denied (moderator) ─────────────────────────────────────────────────
  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="text-lg font-semibold text-gray-800">Доступно только администратору</h1>
        <p className="text-sm text-gray-500">Раздел «Тарифы» доступен только пользователям с ролью «Администратор».</p>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (isAdmin === null || loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Загрузка...
      </div>
    );
  }

  // ── Data error ────────────────────────────────────────────────────────────────
  if (dataError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        {dataError}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const baseMap = new Map(baseTariffs.map((t) => [t.lead_type, t]));

  return (
    <>
      {toast && <Toast message={toast} />}

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Тарифы</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Настройка вознаграждений: базовые тарифы и городские исключения
        </p>
      </div>

      {/* ─── Base tariffs ──────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Базовые тарифы
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Тип лида</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Метод</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Значение</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {LEAD_TYPES.map((type) => {
                const tariff = baseMap.get(type);
                return (
                  <tr key={type} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {TYPE_LABELS[type]}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {tariff ? (tariff.method === 'percent' ? 'Процент' : 'Фиксированная') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {tariff ? (
                        <span className="font-medium text-gray-900">
                          {fmtValue(tariff.method, tariff.value)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                          Не настроен
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openEditBase(type)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {tariff ? 'Изменить' : 'Задать'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── City overrides ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Городские исключения
          </h2>
          <button
            onClick={openAddOverride}
            className="inline-flex items-center gap-1.5 text-sm font-medium bg-slate-800 text-white rounded-lg px-3.5 py-1.5 hover:bg-slate-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            Добавить исключение
          </button>
        </div>

        {overrides.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-sm font-medium text-gray-700 mb-1">Городских исключений нет</p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Городские исключения позволяют задать особый тариф для конкретного города.
              Если исключения нет — действует базовый тариф по типу.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Тип лида</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Город</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Метод</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Значение</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overrides.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {TYPE_LABELS[t.lead_type] ?? t.lead_type}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{t.city}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {t.method === 'percent' ? 'Процент' : 'Фиксированная'}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {fmtValue(t.method, t.value)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {pendingDeleteId === t.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-gray-500">Удалить?</span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleting}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Нет
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setPendingDeleteId(t.id)}
                          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-5">
              {modalMode === 'editBase' ? (
                <>
                  {baseTariffs.find((t) => t.lead_type === fixedLeadType)
                    ? 'Изменить базовый тариф'
                    : 'Задать базовый тариф'}
                </>
              ) : (
                'Добавить городское исключение'
              )}
            </h2>

            <div className="space-y-4">
              {/* Lead type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Тип лида
                </label>
                {modalMode === 'editBase' ? (
                  <p className="text-sm font-medium text-gray-900">
                    {TYPE_LABELS[fixedLeadType]}
                  </p>
                ) : (
                  <select
                    value={formLeadType}
                    onChange={(e) => setFormLeadType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {LEAD_TYPES.map((t) => (
                      <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* City (override only) */}
              {modalMode === 'addOverride' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Город
                  </label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  >
                    {cities.length === 0 && (
                      <option value="">Нет активных городов</option>
                    )}
                    {cities.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Method */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Метод расчёта
                </label>
                <MethodToggle
                  value={formMethod}
                  onChange={(m) => { setFormMethod(m); setFormError(''); }}
                />
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {formMethod === 'percent' ? 'Процент (0–100)' : 'Сумма, ₸'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={formMethod === 'percent' ? 100 : undefined}
                    step={formMethod === 'percent' ? 0.01 : 1}
                    value={formValue}
                    onChange={(e) => { setFormValue(e.target.value); setFormError(''); }}
                    placeholder={formMethod === 'percent' ? 'Например: 25' : 'Например: 50000'}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                    {formMethod === 'percent' ? '%' : '₸'}
                  </span>
                </div>
                {formError && (
                  <p className="text-xs text-red-600 mt-1">{formError}</p>
                )}
              </div>

              {/* Hint */}
              {formMethod === 'percent' && modalMode === 'editBase' && (
                <p className="text-xs text-gray-400">
                  Вознаграждение автора = комиссия специалиста × процент тарифа
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
