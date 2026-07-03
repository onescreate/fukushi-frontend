import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, PanelLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, useMe } from '../../features/auth/useMe';
import { usePendingCount } from '../../features/schedules/approvalApi';
import { NAV_ITEMS } from '../../app/nav';

const ROLE_LABEL: Record<string, string> = {
  system_admin: 'システム管理者',
  corporation_admin: '法人管理者',
  facility_admin: '店舗管理者',
  staff: 'スタッフ',
};

const STORAGE_KEY = 'sidebar-collapsed';

export default function AppLayout() {
  const { logout } = useAuth();
  const { data: me } = useMe();
  const location = useLocation();
  const canApprove = hasPermission(me, 'schedule.approve');
  const { data: pending } = usePendingCount(canApprove);
  const pendingCount = pending?.count ?? 0;

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.permission || me?.permissions?.includes(item.permission),
  );

  const current = [...visibleNav]
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) =>
      i.to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(i.to),
    );

  const roleLabel = me?.roles?.[0]
    ? (ROLE_LABEL[me.roles[0].role] ?? me.roles[0].role)
    : '';

  return (
    <div className="min-h-screen bg-muted/40">
      {/* サイドバー */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* ブランド */}
        <div
          className={`flex h-14 items-center border-b border-sidebar-border ${
            collapsed ? 'justify-center px-0' : 'gap-3 px-5'
          }`}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
            福
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold text-sidebar-foreground">
                就労支援
              </p>
              <p className="text-[11px] text-muted-foreground">
                利用者管理システム
              </p>
            </div>
          )}
        </div>

        {/* ナビ */}
        <nav className="flex-1 space-y-0.5 p-2">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center rounded-md py-2 text-sm font-medium transition-colors ${
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                  } ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`
                }
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {item.to === '/approvals' && pendingCount > 0 && (
                  <span
                    className={`flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ${
                      collapsed ? 'absolute right-1 top-1 h-4' : 'h-5'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ユーザー */}
        <div className="border-t border-sidebar-border p-2">
          <div
            className={`flex items-center rounded-md p-2 ${
              collapsed ? 'flex-col gap-2' : 'gap-3'
            }`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              {me?.name?.charAt(0) ?? '—'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {me?.name ?? '—'}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
            )}
            <button
              onClick={() => logout()}
              title="ログアウト"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 本体 */}
      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-200 ${
          collapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-6 backdrop-blur">
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'サイドバーを開く' : 'サイドバーを折りたたむ'}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft className="size-4" />
          </button>
          <h1 className="text-sm font-semibold text-foreground">
            {current?.label ?? ''}
          </h1>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
