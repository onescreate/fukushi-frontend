import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarDays,
  Utensils,
  HeartPulse,
  Receipt,
  ClipboardList,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMe } from '../../features/auth/useMe';
import { Button } from '@/components/ui/button';

// 開発プレビュー中は全タブを表示（食事は本来 mealsEnabled の利用者のみ）
const DEV_PREVIEW = import.meta.env.VITE_DEV_SCREENS === '1';

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export default function PersonalLayout() {
  const { logout } = useAuth();
  const { data: me } = useMe();

  const showMeals = DEV_PREVIEW || !!me?.mealsEnabled;
  const tabs: Tab[] = [
    { to: '/my', label: '予定', icon: CalendarDays, end: true },
    ...(showMeals ? [{ to: '/my/meals', label: '食事', icon: Utensils }] : []),
    { to: '/my/health', label: '健康', icon: HeartPulse },
    { to: '/my/billing', label: '請求', icon: Receipt },
    { to: '/my/history', label: '履歴', icon: ClipboardList },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50">
      {/* ヘッダー（上部に固定） */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[11px] font-medium text-slate-400">
              {me?.facilityName ?? '就労支援 マイページ'}
            </p>
            <p className="truncate text-base font-bold text-slate-800">
              {me?.name ? `${me.name} さん` : '利用者ページ'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="shrink-0 gap-1.5"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">ログアウト</span>
          </Button>
        </div>

        {/* PC・タブレット用：上部タブ（アイコン付き横並び）。スマホでは下部バーを使うため隠す。 */}
        <nav className="mx-auto hidden w-full max-w-5xl gap-1 px-4 sm:px-6 lg:px-8 md:flex">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <t.icon className="size-4" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* 本文：PC/タブレットは幅広。スマホは下部タブバー分の余白(pb)を確保。 */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-6 lg:px-8 md:pb-10">
        <Outlet />
      </main>

      {/* スマホ用：下部タブバー（親指で押しやすい・画面下に固定）。PC/タブレットでは隠す。 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] backdrop-blur md:hidden">
        <div className="flex items-stretch">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 active:text-slate-600'
                }`
              }
            >
              <t.icon className="size-[22px]" strokeWidth={2} />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
