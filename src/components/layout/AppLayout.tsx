import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarClock, ChevronsLeft, HelpCircle, ListTodo, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission, useMe } from '../../features/auth/useMe';
import { useBadges } from '../../features/stats/api';
import { NAV_GROUPS, type NavItem } from '../../app/nav';

// ヘッダーに常時表示する「ポータル連携」リンク（会計ポータルのタスク/カレンダーを窓表示するページへ）。
const HEADER_LINKS = [
  { to: '/portal-tasks', label: 'タスク', icon: ListTodo },
  { to: '/portal-calendar', label: 'カレンダー', icon: CalendarClock },
] as const;
import { FacilityProvider } from '../../contexts/FacilityContext';
import { FacilitySwitcher } from './FacilitySwitcher';
import { SystemSwitcher } from './SystemSwitcher';

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
  // 通知バッジは1本のエンドポイント(/stats/badges)に集約（毎分4回のポーリング→1回）。各件数はサーバ側で権限判定。
  const anyBadge =
    hasPermission(me, 'schedule.approve') ||
    hasPermission(me, 'meal.manage') ||
    hasPermission(me, 'billing.view') ||
    hasPermission(me, 'meal.delivery.manage') ||
    hasPermission(me, 'health.view');
  const { data: badges } = useBadges(anyBadge);
  const badgeCountFor = (to: string) => {
    if (!badges) return 0;
    if (to === '/meal-billing') return badges.unpaid;
    if (to === '/meal-deliveries') return badges.deliveryMissing;
    if (to === '/health-records') return badges.healthMissing;
    if (to === '/approvals') return badges.pendingSchedule;
    if (to === '/meal-approvals') return badges.pendingMeal;
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

  const roleLabel = me?.roles?.[0]
    ? (ROLE_LABEL[me.roles[0].role] ?? me.roles[0].role)
    : '';

  // ポータルのタスク/カレンダー(埋め込み)は、枠・余白を作らずメイン領域いっぱいに表示する。
  const isFullBleed = ['/portal-tasks', '/portal-calendar'].some((p) =>
    location.pathname.startsWith(p),
  );

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
          {/* ブランド＝システム切替（KGI踏襲）＋折りたたみボタン */}
          <div
            className={`flex min-h-[52px] shrink-0 items-center gap-1 border-b border-white/[0.06] ${
              collapsed ? 'justify-center px-1.5' : 'px-2'
            }`}
          >
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <SystemSwitcher collapsed={false} />
              </div>
            )}
            <button
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? 'サイドバーを開く' : 'サイドバーを折りたたむ'}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#8A8B98] transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {collapsed ? (
                <Menu className="size-[18px]" />
              ) : (
                <ChevronsLeft className="size-[18px]" />
              )}
            </button>
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
          <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-white/[0.06] bg-[#14141C] px-6 shadow-sm">
            <nav className="flex items-center gap-1">
              {HEADER_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-indigo-500/25 text-white'
                        : 'text-[#8A8B98] hover:bg-indigo-500/15 hover:text-white'
                    }`
                  }
                >
                  <Icon className="size-[16px]" strokeWidth={1.9} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto">
              <FacilitySwitcher />
            </div>
          </header>

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#FBFBFC]">
            {isFullBleed ? (
              <Outlet />
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
                  <Outlet />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </FacilityProvider>
  );
}
