'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatPhone } from '@/lib/format';

interface CompanyProfile {
  id: string;
  name: string;
  bin: string;
  phone: string;
  city: string;
  status: string;
  rejection_reason: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const STATUS_BANNER: Record<string, { label: string; desc: string; cls: string; dot: string }> = {
  new: {
    label: 'Не подтверждена',
    desc: 'Загрузите документы для начала процедуры верификации.',
    cls: 'bg-gray-50 border-gray-200 text-gray-700',
    dot: 'bg-gray-400',
  },
  pending: {
    label: 'На рассмотрении',
    desc: 'Документы переданы модератору. Ожидайте результата проверки.',
    cls: 'bg-amber-50 border-amber-200 text-amber-800',
    dot: 'bg-amber-400',
  },
  active: {
    label: 'Верифицирована',
    desc: 'Ваша компания прошла проверку и может выступать гарантом.',
    cls: 'bg-green-50 border-green-200 text-green-800',
    dot: 'bg-green-500',
  },
  rejected: {
    label: 'Отклонена',
    desc: '',
    cls: 'bg-red-50 border-red-200 text-red-800',
    dot: 'bg-red-500',
  },
  blocked: {
    label: 'Заблокирована',
    desc: 'Обратитесь к администратору для выяснения причины.',
    cls: 'bg-gray-100 border-gray-300 text-gray-700',
    dot: 'bg-gray-500',
  },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<CompanyProfile>('/companies/me')
      .then(setProfile)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Не удалось загрузить профиль'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        {error || 'Профиль не найден'}
      </div>
    );
  }

  const banner = STATUS_BANNER[profile.status] ?? STATUS_BANNER.new;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Профиль компании</h1>
        <p className="text-sm text-gray-500 mt-0.5">{profile.name}</p>
      </div>

      {/* Status banner */}
      <div className={`flex items-start gap-3 border rounded-xl p-4 mb-6 ${banner.cls}`}>
        <span className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${banner.dot}`} />
        <div>
          <p className="font-medium text-sm">{banner.label}</p>
          {profile.status === 'rejected' && profile.rejection_reason ? (
            <p className="text-sm mt-0.5">
              Причина отказа: <span className="font-medium">{profile.rejection_reason}</span>
            </p>
          ) : banner.desc ? (
            <p className="text-sm mt-0.5">{banner.desc}</p>
          ) : null}
        </div>
      </div>

      {/* Company info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-w-xl">
        <div className="px-5 py-4 border-b border-gray-50">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Реквизиты</span>
        </div>
        <dl className="divide-y divide-gray-50">
          <Row label="Название" value={profile.name} />
          <Row label="БИН" value={<span className="font-mono tracking-wide">{profile.bin}</span>} />
          <Row label="Город" value={profile.city} />
          <Row label="Телефон" value={<span className="font-mono">{formatPhone(profile.phone)}</span>} />
          <Row label="Дата регистрации" value={fmtDate(profile.created_at)} />
          <Row
            label="Документ"
            value={
              profile.document_url
                ? <span className="text-green-700 font-medium">Загружен</span>
                : <span className="text-gray-400">Не загружен</span>
            }
          />
        </dl>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center px-5 py-3.5 gap-4">
      <dt className="w-44 flex-shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
