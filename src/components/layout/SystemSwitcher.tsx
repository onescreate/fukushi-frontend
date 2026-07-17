import { useState } from 'react';
import {
  Archive,
  ArrowUpRight,
  Building2,
  Check,
  ChevronDown,
  GraduationCap,
  HeartHandshake,
  Target,
  type LucideIcon,
} from 'lucide-react';

// ポータル(会計フロント)のベースURL。未設定なら切替は無効（ブランド表示のみ）。
const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL || '').replace(/\/$/, '');

interface Sys {
  key: string;
  name: string;
  path: string;
  icon: LucideIcon;
}
const OTHER_SYSTEMS: Sys[] = [
  { key: 'portal', name: 'ポータルシステム', path: '/', icon: Building2 },
  { key: 'noukigu', name: '古物管理簿', path: '/noukigu', icon: Archive },
  { key: 'kgi', name: 'KGI管理', path: '/kgi', icon: Target },
  { key: 'training', name: '研修', path: '/training', icon: GraduationCap },
];

/** サイドバー上部のシステム切替（KGI管理踏襲）。他システムへは別タブで移動。 */
export function SystemSwitcher({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const switchable = !!PORTAL_URL;

  const brand = (
    <>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
        <HeartHandshake className="size-[18px]" strokeWidth={2} />
      </div>
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-left text-[13px] font-bold text-[#EDEDF2]">
          福祉管理
        </span>
      )}
      {!collapsed && switchable && (
        <ChevronDown
          className={`size-4 shrink-0 text-[#8A8B98] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      )}
    </>
  );

  if (!switchable) {
    return (
      <div className={`flex w-full items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
        {brand}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="システムを切り替え"
        className={`flex w-full items-center rounded-lg p-1 transition-colors hover:bg-white/[0.06] ${
          collapsed ? 'justify-center' : 'gap-2.5'
        }`}
      >
        {brand}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-[60] mt-2 w-60 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 shadow-[0_18px_44px_-14px_rgba(16,24,40,0.35)]">
            <div className="px-2.5 pt-1.5 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              システムを切り替え
            </div>
            <div className="flex items-center gap-3 rounded-md bg-slate-50 px-2.5 py-2.5">
              <span className="flex size-8 items-center justify-center rounded-md bg-slate-800 text-white">
                <HeartHandshake className="size-[17px]" strokeWidth={2} />
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate text-[13.5px] font-bold text-slate-800">福祉管理</span>
                <span className="rounded border border-slate-200 px-1 py-px text-[9.5px] font-bold text-slate-400">
                  現在
                </span>
              </div>
              <Check className="size-4 text-slate-500" />
            </div>
            <div className="my-1 border-t border-slate-100" />
            {OTHER_SYSTEMS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.key}
                  href={PORTAL_URL + s.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-md px-2.5 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-colors group-hover:bg-slate-200">
                    <Icon className="size-[17px]" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-slate-800">
                    {s.name}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-500" />
                </a>
              );
            })}
            <div className="mt-1 border-t border-slate-100 px-2.5 pt-2 pb-1 text-[10px] font-semibold text-slate-400">
              別タブで開きます
            </div>
          </div>
        </>
      )}
    </div>
  );
}
