import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, GripVertical, X } from 'lucide-react';

// 開発中だけ表示：VITE_DEV_SCREENS=1 のときに 3画面を行き来できるフローティングバー。
const SHOW = import.meta.env.VITE_DEV_SCREENS === '1';
// /fukushi 配下で配信されるため、リンクにベースパスを前置する（付けないとポータル側へ遷移してしまう）。
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const POS_KEY = 'dev_switcher_pos';
const COLLAPSED_KEY = 'dev_switcher_collapsed';

const SCREENS: { label: string; path: string; match: (p: string) => boolean }[] = [
  {
    label: '管理者',
    path: '/',
    match: (p) => !p.startsWith('/my') && !p.startsWith('/kiosk'),
  },
  { label: '利用者', path: '/my', match: (p) => p.startsWith('/my') },
  { label: 'タブレット', path: '/kiosk', match: (p) => p.startsWith('/kiosk') },
];

interface Pos {
  right: number;
  bottom: number;
}

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Pos>;
      if (typeof p.right === 'number' && typeof p.bottom === 'number') {
        return { right: p.right, bottom: p.bottom };
      }
    }
  } catch {
    /* noop */
  }
  return { right: 12, bottom: 12 };
}

/**
 * 開発用：施設タブレット/利用者/管理者 の3画面を切り替えるフローティングバー。
 * 画面の内容に重なって見えなくなることがあるため、
 * つまみ（⠿）でドラッグして好きな位置へ動かせ、×で小さく畳める（位置・状態は記憶する）。
 */
export function DevScreenSwitcher() {
  const loc = useLocation();
  const [pos, setPos] = useState<Pos>(loadPos);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === '1',
  );
  const drag = useRef({ on: false, x: 0, y: 0, right: 0, bottom: 0 });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  if (!SHOW) return null;

  const onDown = (e: RPointerEvent) => {
    drag.current = {
      on: true,
      x: e.clientX,
      y: e.clientY,
      right: pos.right,
      bottom: pos.bottom,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
  };
  const onMove = (e: RPointerEvent) => {
    if (!drag.current.on) return;
    // 右下からの距離で位置を持つ（右へドラッグ＝rightが減る）
    const right = Math.max(
      0,
      Math.min(drag.current.right - (e.clientX - drag.current.x), window.innerWidth - 60),
    );
    const bottom = Math.max(
      0,
      Math.min(drag.current.bottom - (e.clientY - drag.current.y), window.innerHeight - 40),
    );
    setPos({ right, bottom });
  };
  const onUp = () => {
    if (!drag.current.on) return;
    drag.current.on = false;
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{ right: pos.right, bottom: pos.bottom }}
        title="開発用の画面切替を表示"
        className="fixed z-[9999] flex items-center gap-0.5 rounded-full border border-amber-300 bg-amber-50/95 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 shadow backdrop-blur"
      >
        <ChevronRight className="size-3 rotate-180" />
        開発
      </button>
    );
  }

  return (
    <div
      style={{ right: pos.right, bottom: pos.bottom }}
      className="fixed z-[9999] flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50/95 px-1.5 py-1.5 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.3)] backdrop-blur"
    >
      <span
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        title="ドラッグで移動"
        className="grid size-6 cursor-grab touch-none place-items-center rounded-full text-amber-600 select-none active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </span>
      {SCREENS.map((s) => {
        const active = s.match(loc.pathname);
        return (
          <a
            key={s.path}
            href={`${BASE}${s.path}`}
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
      <button
        onClick={() => setCollapsed(true)}
        title="小さく畳む"
        className="grid size-6 place-items-center rounded-full text-amber-600 transition-colors hover:bg-amber-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
