'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatPhone } from '@/lib/format';

interface Company {
  id: string;
  name: string;
  bin: string;
  phone: string;
  city: string;
  status: string;
  document_url: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'На рассмотрении',
  active: 'Активна',
  rejected: 'Отклонена',
  blocked: 'Заблокирована',
};

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  blocked: 'bg-gray-200 text-gray-600',
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState('');
  const [docType, setDocType] = useState<'image' | 'pdf' | null>(null);

  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<Company>(`/moderation/companies/${id}`);
        setCompany(data);
        if (data.document_url) {
          loadDoc(id, data.document_url);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить компанию');
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadDoc(companyId: string, docPath: string) {
    setDocLoading(true);
    setDocError('');
    try {
      const blob = await api.getBlob(`/moderation/companies/${companyId}/document`);
      const url = URL.createObjectURL(blob);
      setDocUrl(url);
      setDocType(blob.type.includes('pdf') || docPath.endsWith('.pdf') ? 'pdf' : 'image');
    } catch (err) {
      setDocError(err instanceof ApiError ? err.message : 'Не удалось загрузить документ');
    } finally {
      setDocLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleApprove() {
    if (!company) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/moderation/companies/${company.id}/approve`);
      setCompany((prev) => prev ? { ...prev, status: 'active', updated_at: new Date().toISOString() } : prev);
      showToast('Компания подтверждена');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка при подтверждении');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!company || !rejectReason.trim()) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/moderation/companies/${company.id}/reject`, { reason: rejectReason });
      setCompany((prev) => prev ? { ...prev, status: 'rejected', rejection_reason: rejectReason, updated_at: new Date().toISOString() } : prev);
      setRejecting(false);
      setRejectReason('');
      showToast('Компания отклонена');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Ошибка при отклонении');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Загрузка...
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        {error || 'Компания не найдена'}
      </div>
    );
  }

  return (
    <>
      {/* Back */}
      <button
        onClick={() => router.push('/companies')}
        className="text-sm text-gray-500 hover:text-gray-800 mb-5 flex items-center gap-1 transition-colors"
      >
        ← Назад к списку
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: company info + actions */}
        <div className="space-y-5">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">{company.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                  STATUS_CLASS[company.status] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {STATUS_LABEL[company.status] ?? company.status}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">БИН</dt>
                <dd className="font-mono text-gray-800 font-medium">{company.bin}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">Город</dt>
                <dd className="text-gray-800">{company.city}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">Телефон</dt>
                <dd className="font-mono text-gray-800">{formatPhone(company.phone)}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs mb-0.5">Дата заявки</dt>
                <dd className="text-gray-800">{fmtDateTime(company.created_at)}</dd>
              </div>
            </dl>

            {/* Status-specific info */}
            {company.status === 'active' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Активна с{' '}
                  <span className="font-medium text-gray-700">{fmtDateTime(company.updated_at)}</span>
                </p>
              </div>
            )}

            {company.status === 'rejected' && company.rejection_reason && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Причина отклонения</p>
                <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
                  {company.rejection_reason}
                </p>
              </div>
            )}
          </div>

          {/* Moderation actions — pending only */}
          {company.status === 'pending' && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Решение по заявке</h2>

              {actionError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                  {actionError}
                </p>
              )}

              {!rejecting ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? '...' : 'Подтвердить'}
                  </button>
                  <button
                    onClick={() => setRejecting(true)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Отклонить
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Причина отклонения
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Укажите причину отклонения..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {actionLoading ? '...' : 'Подтвердить отклонение'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejecting(false); setRejectReason(''); setActionError(''); }}
                      disabled={actionLoading}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: document viewer */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Документ юрлица</h2>

          <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden min-h-[300px] flex items-center justify-center">
            {!company.document_url ? (
              <span className="text-gray-400 text-sm">Документ не загружен</span>
            ) : docLoading ? (
              <span className="text-gray-400 text-sm">Загрузка документа...</span>
            ) : docError ? (
              <span className="text-red-500 text-sm px-4 text-center">{docError}</span>
            ) : docUrl && docType === 'image' ? (
              <img
                src={docUrl}
                alt="Документ компании"
                className="max-w-full max-h-[500px] object-contain"
              />
            ) : docUrl && docType === 'pdf' ? (
              <iframe
                src={docUrl}
                title="Документ компании"
                className="w-full h-[500px] border-0"
              />
            ) : null}
          </div>

          {docUrl && (
            <a
              href={docUrl}
              download={`company_${company.bin}.pdf`}
              className="mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Скачать документ ↓
            </a>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm rounded-lg px-4 py-3 shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  );
}
