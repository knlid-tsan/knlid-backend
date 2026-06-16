'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, clearToken, decodeToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { formatPhone } from '@/lib/format';

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { href: '/verifications', label: 'Верификация' },
  { href: '/leads', label: 'Лиды' },
  { href: '/disputes', label: 'Споры' },
  { href: '/clients', label: 'Клиенты' },
  { href: '/users', label: 'Пользователи' },
  { href: '/companies', label: 'Компании' },
  { href: '/support', label: 'Поддержка' },
  { href: '/tariffs', label: 'Тарифы', adminOnly: true },
  { href: '/banks', label: 'Банки', adminOnly: true },
  { href: '/audit', label: 'Журнал' },
];

const COMPANY_NAV: NavItem[] = [
  { href: '/company/applications', label: 'Заявки' },
  { href: '/company/specialists', label: 'Мои специалисты' },
  { href: '/company/debts', label: 'Долги' },
  { href: '/company/profile', label: 'Профиль компании' },
  { href: '/company/support', label: 'Поддержка' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phone, setPhone] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [rawRole, setRawRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supportUnread, setSupportUnread] = useState(0);
  const [companySupportUnread, setCompanySupportUnread] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    const payload = decodeToken(token);
    if (!payload || !['admin', 'moderator', 'company'].includes(payload.role)) {
      clearToken();
      router.replace('/login');
      return;
    }
    setPhone(payload.phone);
    setRawRole(payload.role);
    if (payload.role === 'admin') setRoleLabel('Администратор');
    else if (payload.role === 'moderator') setRoleLabel('Модератор');
    else setRoleLabel('Компания');
    setReady(true);
  }, [router]);

  // Fetch company name for company cabinet header
  useEffect(() => {
    if (rawRole !== 'company') return;
    api.get<{ name: string }>('/companies/me')
      .then((d) => setCompanyName(d.name))
      .catch(() => {});
  }, [rawRole]);

  // Poll unread support count for company nav badge
  useEffect(() => {
    if (rawRole !== 'company') return;
    const fetch = () => {
      api.get<{ count: number }>('/support/unread')
        .then((d) => setCompanySupportUnread(d.count))
        .catch(() => {});
    };
    fetch();
    const timer = setInterval(fetch, 30_000);
    return () => clearInterval(timer);
  }, [rawRole]);

  // Poll unread support count for admin/moderator nav badge
  useEffect(() => {
    if (rawRole !== 'admin' && rawRole !== 'moderator') return;
    const fetch = () => {
      api.get<{ count: number }>('/support/admin/unread')
        .then((d) => setSupportUnread(d.count))
        .catch(() => {});
    };
    fetch();
    const timer = setInterval(fetch, 30_000);
    return () => clearInterval(timer);
  }, [rawRole]);

  // Enforce role → section boundaries
  useEffect(() => {
    if (!rawRole) return;
    const isCompanySection = pathname.startsWith('/company');
    if (rawRole === 'company' && !isCompanySection) {
      router.replace('/company/applications');
    } else if ((rawRole === 'admin' || rawRole === 'moderator') && isCompanySection) {
      router.replace('/verifications');
    }
  }, [rawRole, pathname, router]);

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted text-sm">Загрузка...</span>
      </div>
    );
  }

  const isCompany = rawRole === 'company';
  const navItems = isCompany ? COMPANY_NAV : ADMIN_NAV;

  return (
    <div className="flex h-screen bg-background">
      {isCompany ? (
        /* Company cabinet — branded light sidebar */
        <aside className="w-52 bg-surface border-r border-divider flex flex-col flex-shrink-0">
          <div className="h-14 flex items-center px-5 border-b border-divider flex-shrink-0">
            <div className="flex items-center">
              <span className="text-[26px] font-bold text-brand tracking-[-1.5px] leading-none">kn</span>
              <span className="mx-1 w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </span>
              <span className="text-[26px] font-bold text-brand tracking-[-1.5px] leading-none">lid</span>
            </div>
          </div>
          <nav className="flex-1 py-3">
            {navItems.map((item) => {
              const isCurrent = pathname.startsWith(item.href);
              const badge = item.href === '/company/support' && companySupportUnread > 0
                ? companySupportUnread : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-5 py-2.5 text-sm transition-colors border-l-2 ${
                    isCurrent
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-transparent text-muted hover:text-foreground hover:bg-divider/50'
                  }`}
                >
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="ml-2 bg-brand text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
      ) : (
        /* Admin/moderator — dark sidebar (unchanged) */
        <aside className="w-52 bg-slate-900 flex flex-col flex-shrink-0">
          <div className="px-5 py-4 border-b border-slate-800">
            <span className="text-white font-semibold">KN.LID</span>
            <span className="text-slate-500 text-xs ml-2">Admin</span>
          </div>
          <nav className="flex-1 py-3">
            {navItems.map((item) => {
              if (item.adminOnly && rawRole !== 'admin') return null;
              const isCurrent = pathname.startsWith(item.href);
              const badge = item.href === '/support' && supportUnread > 0 ? supportUnread : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-5 py-2.5 text-sm transition-colors ${
                    isCurrent
                      ? 'bg-slate-700 text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="ml-2 bg-brand text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {isCompany ? (
          /* Company header — descriptor left, company name right */
          <header className="bg-surface border-b border-divider px-6 h-14 flex items-center justify-between flex-shrink-0">
            <span className="text-sm font-medium text-muted tracking-[1.5px] uppercase select-none">
              Передача лидов между специалистами
            </span>
            <div className="flex items-center gap-4">
              {companyName && (
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                    {companyName[0].toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-foreground">{companyName}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-muted hover:text-foreground border border-divider rounded-lg px-3 py-1.5 hover:border-foreground/20 transition-colors"
              >
                Выйти
              </button>
            </div>
          </header>
        ) : (
          /* Admin/moderator header — phone + role + logout */
          <header className="bg-surface border-b border-divider px-6 py-3 flex items-center justify-end flex-shrink-0 gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{formatPhone(phone)}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-muted hover:text-foreground border border-divider rounded-lg px-3 py-1.5 hover:border-foreground/20 transition-colors"
            >
              Выйти
            </button>
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
