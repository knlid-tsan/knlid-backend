'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, clearToken, decodeToken } from '@/lib/auth';

interface NavItem {
  href: string | null;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/verifications', label: 'Верификация' },
  { href: '/leads', label: 'Лиды' },
  { href: '/disputes', label: 'Споры' },
  { href: '/clients', label: 'Клиенты' },
  { href: null, label: 'Пользователи' },
  { href: '/tariffs', label: 'Тарифы', adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phone, setPhone] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [rawRole, setRawRole] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const payload = decodeToken(token);
    if (!payload || payload.role === 'user') {
      clearToken();
      router.replace('/login');
      return;
    }
    setPhone(payload.phone);
    setRawRole(payload.role);
    setRoleLabel(payload.role === 'admin' ? 'Администратор' : 'Модератор');
    setReady(true);
  }, [router]);

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-400 text-sm">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-52 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-slate-800">
          <span className="text-white font-semibold">KN.LID</span>
          <span className="text-slate-500 text-xs ml-2">Admin</span>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && rawRole !== 'admin') return null;

            const isCurrent = item.href !== null && pathname.startsWith(item.href);

            if (item.href === null) {
              return (
                <span
                  key={item.label}
                  className="flex items-center px-5 py-2.5 text-sm text-slate-600 cursor-default"
                >
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center px-5 py-2.5 text-sm transition-colors ${
                  isCurrent
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end flex-shrink-0 gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{phone}</p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors"
          >
            Выйти
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
