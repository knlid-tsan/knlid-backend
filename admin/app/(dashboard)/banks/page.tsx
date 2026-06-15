'use client';

import { useEffect, useState, useRef } from 'react';
import { api, ApiError } from '@/lib/api';

interface Bank {
  id: string;
  name: string;
  is_active: boolean;
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [confirmDeactivate, setConfirmDeactivate] = useState<Bank | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [toast, setToast] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setListError('');
    try {
      const data = await api.get<Bank[]>('/admin/banks');
      setBanks(data);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : 'Не удалось загрузить банки');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setAddError('');
    try {
      const bank = await api.post<Bank>('/admin/banks', { name });
      setBanks((prev) => [...prev, bank].sort((a, b) => a.name.localeCompare(b.name, 'ru')));
      setNewName('');
      showToast('Банк добавлен');
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Ошибка при добавлении');
    } finally {
      setAdding(false);
    }
  }

  function startEdit(bank: Bank) {
    setEditingId(bank.id);
    setEditName(bank.name);
    setEditError('');
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditError('');
  }

  async function handleRename(bank: Bank) {
    const name = editName.trim();
    if (!name || name === bank.name) {
      cancelEdit();
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const updated = await api.patch<Bank>(`/admin/banks/${bank.id}`, { name });
      setBanks((prev) =>
        prev.map((b) => (b.id === bank.id ? updated : b)).sort((a, b) => a.name.localeCompare(b.name, 'ru')),
      );
      setEditingId(null);
      showToast('Название обновлено');
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Ошибка при переименовании');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggle(bank: Bank) {
    setToggleLoading(true);
    try {
      const updated = await api.patch<Bank>(`/admin/banks/${bank.id}`, {
        is_active: !bank.is_active,
      });
      setBanks((prev) => prev.map((b) => (b.id === bank.id ? updated : b)));
      setConfirmDeactivate(null);
      showToast(updated.is_active ? 'Банк активирован' : 'Банк деактивирован');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    } finally {
      setToggleLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Банки</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Список банков для платёжных реквизитов
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
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">Статус</th>
                <th className="px-4 py-3 w-48" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {banks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-gray-400">
                    Банков нет — добавьте первый ниже
                  </td>
                </tr>
              ) : (
                banks.map((bank) => (
                  <tr key={bank.id} className={`hover:bg-gray-50/50 transition-colors${!bank.is_active ? ' opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {editingId === bank.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            ref={editInputRef}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRename(bank);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            disabled={editLoading}
                            className="border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                          />
                          <button
                            onClick={() => handleRename(bank)}
                            disabled={editLoading}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                          >
                            {editLoading ? '...' : 'Сохранить'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={editLoading}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                          >
                            Отмена
                          </button>
                          {editError && (
                            <span className="text-red-500 text-xs">{editError}</span>
                          )}
                        </div>
                      ) : (
                        <span>{bank.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {bank.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                          Неактивен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {editingId !== bank.id && (
                          <button
                            onClick={() => startEdit(bank)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Переименовать
                          </button>
                        )}
                        {bank.is_active ? (
                          <button
                            onClick={() => setConfirmDeactivate(bank)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Деактивировать
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggle(bank)}
                            disabled={toggleLoading}
                            className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            Активировать
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Add bank form */}
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/40">
            <form onSubmit={handleAdd} className="flex items-center gap-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Название банка"
                disabled={adding}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={adding || !newName.trim()}
                className="bg-blue-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {adding ? '...' : 'Добавить'}
              </button>
              {addError && (
                <span className="text-red-500 text-xs">{addError}</span>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Confirm deactivation dialog */}
      {confirmDeactivate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setConfirmDeactivate(null)}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Деактивировать банк?</h3>
            <p className="text-sm text-gray-600">
              Банк <strong>«{confirmDeactivate.name}»</strong> исчезнет из списка при выборе реквизитов. Существующие реквизиты не изменятся.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleToggle(confirmDeactivate)}
                disabled={toggleLoading}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {toggleLoading ? '...' : 'Деактивировать'}
              </button>
              <button
                onClick={() => setConfirmDeactivate(null)}
                disabled={toggleLoading}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm rounded-lg px-4 py-3 shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  );
}
