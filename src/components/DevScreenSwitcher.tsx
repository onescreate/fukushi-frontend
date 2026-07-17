import { useLocation } from 'react-router-dom';

// 開発中だけ表示：VITE_DEV_SCREENS=1 のときに 3画面を行き来できるフローティングバー。
const SHOW = import.meta.env.VITE_DEV_SCREENS === '1';

const SCREENS: { label: string; path: string; match: (p: string) => boolean }[] = [
  {
    label: '管理者',
    path: '/',
    match: (p) => !p.startsWith('/my') && !p.startsWith('/kiosk'),
  },
  { label: '利用者', path: '/my', match: (p) => p.startsWith('/my') },
  { label: 'タブレット', path: '/kiosk', match: (p) => p.startsWith('/kiosk') },
];

/** 開発用：施設タブレット/利用者/管理者 の3画面を切り替えるフローティングバー。 */
export function DevScreenSwitcher() {
  const loc = useLocation();
  if (!SHOW) return null;
  return (
    <div className="fixed bottom-3 right-3 z-[9999] flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50/95 px-2 py-1.5 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)] backdrop-blur">
      <span className="px-1 text-[10px] font-black uppercase tracking-wider text-amber-600">
        開発
      </span>
      {SCREENS.map((s) => {
        const active = s.match(loc.pathname);
        return (
          <a
            key={s.path}
            href={s.path}
            className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
              active
                ? 'bg-amber-500 text-white'
                : 'bg-white text-amber-700 hover:bg-amber-100'
            }`}
          >
            {s.label}
          </a>
        );
      })}
    </div>
  );
}
