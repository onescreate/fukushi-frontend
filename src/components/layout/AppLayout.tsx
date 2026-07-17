import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { HelpCircle, LogOut, PanelLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, useMe } from '../../features/auth/useMe';
import { usePendingCount } from '../../features/schedules/approvalApi';
import { usePendingMealCount } from '../../features/meals/reservationApi';
import { useBadges } from '../../features/stats/api';
import { useHealthMissingCount } from '../../features/health/api';
import { NAV_GROUPS, ALL_DESTINATIONS, type NavItem } from '../../app/nav';
import { FacilityProvider } from '../../contexts/FacilityContext';
import { FacilitySwitcher } from './FacilitySwitcher';

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

  const canApproveMeal = hasPermission(me, 'meal.manage');
  const { data: mealPending } = usePendingMealCount(canApproveMeal);
  const mealPendingCount = mealPending?.count ?? 0;

  const canSeeBadges =
    hasPermission(me, 'billing.view') || hasPermission(me, 'meal.delivery.manage');
  const { data: badges } = useBadges(canSeeBadges);
  const canViewHealth = hasPermission(me, 'health.view');
  const { data: healthMissing } = useHealthMissingCount(canViewHealth);
  const badgeCountFor = (to: string) => {
    if (to === '/meal-billing') return badges?.unpaid ?? 0;
    if (to === '/meal-deliveries') return badges?.deliveryMissing ?? 0;
    if (to === '/health-records') return healthMissing?.count ?? 0;
    if (to === '/approvals') return pendingCount;
    if (to === '/meal-approvals') return mealPendingCount;
    return 0;
  };

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  );
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const canSee = (item: NavItem) =>
    !item.permission || me?.permissions?.includes(item.permission);
  // ハブは子のいずれかが見えれば表示
  const isVisible = (item: NavItem) =>
    item.children ? item.children.some(canSee) : canSee(item);

  const current = [...ALL_DESTINATIONS]
    .sort((a, b) => b.to.length - a.to.length)
    .find((i) =>
      i.to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(i.to),
    );

  const roleLabel = me?.roles?.[0]
    ? (ROLE_LABEL[me.roles[0].role] ?? me.roles[0].role)
    : '';

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const badge = badgeCountFor(item.to);
    // ハブは自身か子のいずれかのパスに居ればアクティブ
    const active =
      item.to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.to) ||
          (item.children?.some((c) => location.pathname.startsWith(c.to)) ??
            false);
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === '/'}
        title={collapsed ? item.label : undefined}
        className={`group relative flex items-center rounded-lg text-[12.5px] font-semibold transition-all duration-150 ${
          collapsed ? 'h-9 justify-center' : 'h-9 gap-3 px-2.5'
        } ${
          active
            ? 'bg-gradient-to-r from-indigo-500/25 to-indigo-500/[0.08] text-white shadow-sm shadow-black/20'
            : 'text-[#8A8B98] hover:bg-indigo-500/15 hover:text-white'
        }`}
      >
        <span
          className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-indigo-500 transition-opacity ${
            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
          }`}
        />
        <Icon
          className={`size-[18px] shrink-0 transition-colors ${
            active ? 'text-indigo-300' : 'text-[#8A8B98] group-hover:text-indigo-300'
          }`}
          strokeWidth={1.9}
        />
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {badge > 0 && (
          <span
            className={`flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ${
              collapsed ? 'absolute right-1 top-1 h-4' : 'h-[18px]'
            }`}
          >
            {badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <FacilityProvider>
      <div className="flex h-screen overflow-hidden bg-[#FBFBFC]">
        {/* サイドバー（濃紺クローム） */}
        <aside
          className={`z-[900] flex shrink-0 flex-col bg-[#14141C] transition-[width] duration-200 ease-in-out ${
            collapsed ? 'w-14' : 'w-[224px]'
          }`}
        >
          {/* ブランド */}
          <div
            className={`flex min-h-[52px] shrink-0 items-center border-b border-white/[0.06] ${
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-4'
            }`}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[13px] font-black text-white shadow-sm">
              福
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-[#EDEDF2]">就労支援</p>
                <p className="text-[10px] font-medium text-[#8A8B98]">
                  利用者管理システム
                </p>
              </div>
            )}
          </div>

          {/* ナビ（グループ化） */}
          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {NAV_GROUPS.map((group, gi) => {
              const items = group.items.filter(isVisible);
              if (items.length === 0) return null;
              return (
                <div key={group.title ?? `g${gi}`}>
                  {group.title &&
                    (collapsed ? (
                      <div className="my-2 mx-1 border-t border-white/[0.06]" />
                    ) : (
                      <div className="px-2.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#5D5E6B]">
                        {group.title}
                      </div>
                    ))}
                  <div className="space-y-0.5">{items.map(renderItem)}</div>
                </div>
              );
            })}
          </nav>

          {/* フッター：ヘルプ・ユーザー・ログアウト */}
          <div className="shrink-0 border-t border-white/[0.06] p-2">
            <NavLink
              to="/help"
              title={collapsed ? 'ヘルプ・使い方' : undefined}
              className={({ isActive }) =>
                `group flex h-9 items-center rounded-lg text-[12.5px] font-semibold transition-colors ${
                  collapsed ? 'justify-center' : 'gap-3 px-2.5'
                } ${
                  isActive
                    ? 'bg-indigo-500/15 text-white'
                    : 'text-[#8A8B98] hover:bg-indigo-500/15 hover:text-white'
                }`
              }
            >
              <HelpCircle className="size-[18px] shrink-0" strokeWidth={1.9} />
              {!collapsed && <span>ヘルプ・使い方</span>}
            </NavLink>

            <div
              className={`mt-1 flex items-center rounded-lg p-2 ${
                collapsed ? 'flex-col gap-2' : 'gap-2.5'
              }`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-[13px] font-black text-white">
                {me?.name?.charAt(0) ?? '—'}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[12.5px] font-bold text-[#EDEDF2]">
                    {me?.name ?? '—'}
                  </p>
                  <p className="truncate text-[10px] font-medium text-[#8A8B98]">
                    {roleLabel}
                  </p>
                </div>
              )}
              <button
                onClick={() => logout()}
                title="ログアウト"
                className="flex size-8 items-center justify-center rounded-lg text-[#8A8B98] transition-colors hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* 本体（ヘッダー＋メイン） */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#14141C] px-4 shadow-sm">
            <button
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? 'サイドバーを開く' : 'サイドバーを折りたたむ'}
              className="flex size-8 items-center justify-center rounded-lg text-[#8A8B98] transition-colors hover:bg-indigo-500/20 hover:text-indigo-200"
            >
              <PanelLeft className="size-4" />
            </button>
            <h1 className="text-[14px] font-bold tracking-wide text-white">
              {current?.label ?? ''}
            </h1>
            <div className="ml-auto">
              <FacilitySwitcher />
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-y-auto bg-[#FBFBFC]">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </FacilityProvider>
  );
}
