import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMe } from '../../features/auth/useMe';
import { Button } from '@/components/ui/button';

// 開発プレビュー中は全タブを表示（食事は本来 mealsEnabled の利用者のみ）
const DEV_PREVIEW = import.meta.env.VITE_DEV_SCREENS === '1';

export default function PersonalLayout() {
  const { logout } = useAuth();
  const { data: me } = useMe();

  const showMeals = DEV_PREVIEW || !!me?.mealsEnabled;
  const tabs = [
    { to: '/my', label: '予定', end: true },
    ...(showMeals ? [{ to: '/my/meals', label: '食事', end: false }] : []),
    { to: '/my/health', label: '健康', end: false },
    { to: '/my/billing', label: '請求', end: false },
    { to: '/my/history', label: '履歴', end: false },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              福
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {me?.name ? `${me.name} さん` : '利用者ページ'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            ログアウト
          </Button>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 sm:px-5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors sm:px-4 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5 sm:px-5 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
