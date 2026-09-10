// ===========================================
// 「質問はこちら」の入口
//
// 画面の右に浮かぶボタンです。上下にドラッグして動かせます。
// ★作法は不具合報告のボタン（ErrorReportButton.tsx）と同じにしています。
//   覚えることを増やさないためです。位置の記憶はボタンごとに別のキーです。
// ★色は濃い水色（会計ポータル・KGI・介護・古物と同じ）。
//   不具合報告の赤とも、福祉の藍色とも区別が付き、2つ並んだときに見分けられます。
// ★重なり順：不具合報告 100000 ＞ このボタン 99500 ＞ 使い方を聞く窓 99000。
// ===========================================
import { useEffect, useRef, useState } from 'react';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';

const KEY = 'fukushi_chat_btn_bottom';
const DEFAULT_BOTTOM = 260;   // 不具合報告（176）より上に置き、最初から重ならないようにします
const BLOCK_H = 88;           // 矢印を含めたひとかたまりの高さ

// 覚えた位置を、いまの画面に収め直します。
// ★これが無いと、画面が小さくなったときにボタンが画面の外へ出て押せなくなります。
//   入口はこのボタンだけなので、開く手立てが無くなってしまいます。
const fit = (v: number): number => {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  return Math.max(16, Math.min(Number(v) || DEFAULT_BOTTOM, Math.max(16, vh - BLOCK_H)));
};

export default function AiChatLauncher({ onOpen, hidden }: { onOpen: () => void; hidden: boolean }) {
  const [bottom, setBottom] = useState(() => {
    const v = parseInt(localStorage.getItem(KEY) || '', 10);
    return fit(Number.isFinite(v) ? v : DEFAULT_BOTTOM);
  });

  useEffect(() => {
    const onResize = () => setBottom((b) => fit(b));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const dragRef = useRef({ dragging: false, startY: 0, startBottom: DEFAULT_BOTTOM, moved: false });

  const onDragStart = (e: React.PointerEvent) => {
    dragRef.current = { dragging: true, startY: e.clientY, startBottom: bottom, moved: false };
    try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* 使えなくても動きます */ }
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dy) > 4) dragRef.current.moved = true;
    setBottom(fit(dragRef.current.startBottom - dy));
  };
  const onDragEnd = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragRef.current.moved) {
      try { localStorage.setItem(KEY, String(Math.round(bottom))); } catch { /* 覚えられなくても動きます */ }
    }
  };

  // 動かした直後のクリックでは開きません（掴んで離しただけのつもりで開くと戸惑うため）。
  // ★onClick はこの枠に付けます。枠が setPointerCapture でポインタを掴むので、
  //   クリックは枠に対して起き、中の <button> の onClick は呼ばれないためです。
  const handleClick = () => {
    const wasMoved = dragRef.current.moved;
    dragRef.current.moved = false;
    if (wasMoved) return;
    onOpen();
  };

  // 開いている間はボタンを出しません（用は済んでいるうえ、窓に重なって邪魔になります）。
  if (hidden) return null;

  return (
    <div
      onClick={handleClick}
      onPointerDown={onDragStart}
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerCancel={onDragEnd}
      style={{ bottom }}
      className="fixed right-8 z-[99500] flex cursor-grab touch-none select-none flex-col items-center active:cursor-grabbing"
    >
      <ChevronUp className="-mb-0.5 h-3.5 w-3.5 text-[#0284C7]/70" strokeWidth={3} aria-hidden="true" />
      <button
        type="button"
        title="質問はこちら（ドラッグで上下に移動できます）"
        className="flex cursor-grab items-center gap-1.5 rounded-full bg-[#0284C7] py-2.5 pl-3.5 pr-4 text-white shadow-lg transition-colors hover:bg-[#0369A1] active:cursor-grabbing"
      >
        <HelpCircle className="h-4 w-4" />
        {/* ★不具合報告と同じ幅にそろえます（全角6文字＝6em・中央寄せ）。片方だけ変えるとずれます。 */}
        <span className="min-w-[6em] whitespace-nowrap text-center text-sm font-bold">質問はこちら</span>
      </button>
      <ChevronDown className="-mt-0.5 h-3.5 w-3.5 text-[#0284C7]/70" strokeWidth={3} aria-hidden="true" />
    </div>
  );
}
