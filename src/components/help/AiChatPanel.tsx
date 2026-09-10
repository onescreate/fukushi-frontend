// ===========================================
// 質問はこちら（使い方をAIに聞く）
//
// ★4段のはしご。第1〜3段は費用0円で、AIを一度も呼びません。
//   1. よくある質問のボタン … 押せば即答
//   2. 打った言葉が1件だけ当たる … その項目を直接出す
//   3. 複数当たる … 候補を選ばせる
//   4. 当たらない … ここで初めてAIを使う
//
// ★選択肢を「関所」にしません。入力欄は最初から下にあり、いつでも直接聞けます。
// ★中身（説明書）はこのファイルに持ちません。config/chatData.ts から読みます。
//   説明書に1項目足せば、ここにも自動で入ります。
// ★答えを作るのは会計ポータルのAPIです（lib/portalApi.ts の説明を参照）。
// ★やりとりは窓を閉じると消えます（保存しません）。
// ===========================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X, ChevronRight, ChevronDown, ExternalLink, BookOpen, Send, RotateCcw,
  GripVertical, Bot as RobotIcon, Move, Maximize2,
} from 'lucide-react';
import { portalApi, type PortalApiError } from '../../lib/portalApi';
import { CHAT_ITEMS, CHAT_ENTRIES, CHAT_JUMP, CHAT_DEFAULT_FAQ, type ChatItem } from '../../config/chatData';
import TopicBody from './HelpBlocks';

// ───────── 探し方

// 全角・半角・大小・空白のゆれを吸収します。
const nrm = (s: string): string =>
  String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ー–—―‐]/g, '-')
    // 「3か月」「3ヶ月」「3カ月」を同じ形にそろえます（ひらがなで切ると1文字ずつに割れるため）
    .replace(/[かカケヶヵ]月/g, 'ヵ月')
    .replace(/\s/g, '');

const haystack = (it: ChatItem): string =>
  nrm(
    it.title + it.kw + it.can + it.steps.join('') +
    it.terms.map((t) => t.t + t.d).join('') + it.note + it.text,
  );

// 質問から検索語を切り出します。
// ★日本語の質問は「打刻はどこで直すの？」のように助詞・語尾（ひらがな）が混ざります。
//   文章まるごとで探すと説明書のどこにも無く、毎回AIを呼ぶことになります（費用がかかります）。
//   ひらがなの連なりで切り、漢字・カタカナ・英数字のかたまりを検索語にします。
const WORDS = (q: string): string[] => [
  ...new Set(q.split(/[ぁ-ゖ、。・,.?？!！「」『』（）()：:]+/).filter((w) => w.length >= 2)),
];

interface Flat extends ChatItem { hay: string; titleN: string; kwN: string }

const FLAT: Flat[] = CHAT_ITEMS.map((it) => ({
  ...it, hay: haystack(it), titleN: nrm(it.title), kwN: nrm(it.kw),
}));
const byId = (id: string): Flat | undefined => FLAT.find((x) => x.id === id);

// 点数。題名に出るほど強く、本文にちらっと出るだけの一致は弱く数えます。
const scoreOf = (it: Flat, words: string[], whole: string): number => {
  let s = 0;
  for (const w of words) {
    if (!w) continue;
    if (it.titleN.includes(w)) s += 10;
    else if (it.kwN.includes(w)) s += 6;
    else if (it.hay.includes(w)) s += 3;
  }
  if (whole.length >= 4 && it.hay.includes(whole)) s += 15;
  return s;
};

// ───────── 窓の位置と大きさ（パソコンのみ）
const BOX_KEY = 'fukushi_chat_box';
const TIP_KEY = 'fukushi_chat_tip_done';
const MIN_W = 340, MIN_H = 380;

interface Box { x: number; y: number; w: number; h: number }

const clampBox = (b: Box): Box => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.round(Math.max(MIN_W, Math.min(b.w, vw - 16)));
  const h = Math.round(Math.max(MIN_H, Math.min(b.h, vh - 16)));
  return {
    w, h,
    x: Math.round(Math.max(8, Math.min(b.x, vw - w - 8))),
    y: Math.round(Math.max(8, Math.min(b.y, vh - h - 8))),
  };
};

// 既定の置き場所。★右下は不具合報告のボタンの定位置なので、そこを避けて上寄りに出します。
const defaultBox = (): Box => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(420, Math.max(MIN_W, vw - 32));
  const h = Math.min(640, Math.max(MIN_H, vh - 140));
  return clampBox({ w, h, x: vw - w - 24, y: 72 });
};

const loadBox = (): Box => {
  try {
    const v = JSON.parse(localStorage.getItem(BOX_KEY) || 'null') as Box | null;
    if (v && (['x', 'y', 'w', 'h'] as const).every((k) => Number.isFinite(v[k]))) return clampBox(v);
  } catch { /* 壊れていたら既定に戻します */ }
  return defaultBox();
};

// ───────── やりとり
type Msg =
  | { id: string; role: 'me'; text: string }
  | { id: string; role: 'bot'; kind: 'welcome' }
  | { id: string; role: 'bot'; kind: 'entry'; entry: (typeof CHAT_ENTRIES)[number] }
  | { id: string; role: 'bot'; kind: 'candidates'; hits: Flat[]; asked: string }
  | { id: string; role: 'bot'; kind: 'item'; item: Flat }
  | { id: string; role: 'bot'; kind: 'thinking'; phase: 'searching' | 'thinking'; asked: string }
  | { id: string; role: 'bot'; kind: 'ai'; ai: AiAnswer; asked: string }
  | { id: string; role: 'bot'; kind: 'notfound'; aiMsg: string }
  | { id: string; role: 'bot'; kind: 'error'; aiMsg: string };

interface AiAnswer {
  found?: boolean;
  answer?: string;
  steps?: string[];
  caution?: string;
  sourceIds?: string[];
}

let seq = 0;
const nextId = () => `m${++seq}`;
const firstMsgs = (): Msg[] => [{ id: nextId(), role: 'bot', kind: 'welcome' }];

// ───────── 吹き出しの部品
const Bot = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50">
      <RobotIcon className="h-4 w-4 text-indigo-600" />
    </span>
    <div className="min-w-0 flex-1 rounded-xl border border-[#ECEDF1] bg-slate-50/70 px-3.5 py-3">{children}</div>
  </div>
);

const Me = ({ text }: { text: string }) => (
  <div className="flex justify-end">
    <div className="max-w-[85%] rounded-xl bg-indigo-600 px-3.5 py-2.5 text-white">
      <p className="whitespace-pre-wrap break-words text-[13px] font-bold leading-relaxed">{text}</p>
    </div>
  </div>
);

const Choice = ({ onClick, title, sub }: { onClick: () => void; title: string; sub?: string }) => (
  <button
    type="button" onClick={onClick}
    className="flex w-full items-center gap-2 rounded-lg border border-[#ECEDF1] bg-white px-3 py-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
  >
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-bold text-slate-800">{title}</span>
      {sub && <span className="block text-[11px] font-bold text-slate-400">{sub}</span>}
    </span>
    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
  </button>
);

// 3つだけ見せて、残りは「ほかにも見る」でひらきます。
const MoreList = ({ items, render, label }: { items: Flat[]; render: (it: Flat) => React.ReactNode; label: string }) => {
  const [open, setOpen] = useState(false);
  const head = items.slice(0, 3);
  const rest = items.slice(3);
  return (
    <div className="space-y-1.5">
      {head.map(render)}
      {open && rest.map(render)}
      {rest.length > 0 && (
        <button
          type="button" onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11.5px] font-bold text-slate-400 transition-colors hover:bg-white hover:text-indigo-600"
        >
          {open ? '閉じる' : `${label}をほかにも見る（${rest.length}）`}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
      )}
    </div>
  );
};

const ItemBody = ({ item, onClose }: { item: Flat; onClose: () => void }) => {
  const jump = CHAT_JUMP[item.id];
  return (
    <div>
      <p className="mb-2 text-[13.5px] font-bold text-slate-900">{item.title}</p>
      <div className="mb-3"><TopicBody body={item.body} /></div>
      {/* 出典。どこから答えたかを必ず示します。 */}
      <p className="mb-2 text-[11px] font-bold text-slate-400">出典：説明書「{item.cat}」＞「{item.title}」</p>
      <div className="flex flex-wrap gap-2">
        {jump && (
          <Link
            to={jump.to} onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-indigo-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />{jump.label}
          </Link>
        )}
        <Link
          to={`/help?id=${item.id}`} onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ECEDF1] bg-white px-3 py-2 text-[12.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50"
        >
          <BookOpen className="h-3.5 w-3.5" />説明書で開く
        </Link>
      </div>
    </div>
  );
};

const AiBody = ({ ai, onOpenItem }: { ai: AiAnswer; onOpenItem: (it: Flat) => void }) => (
  <div>
    <p className="mb-1 text-[11px] font-bold text-emerald-600">答え</p>
    <p className="whitespace-pre-wrap text-[13px] font-bold leading-relaxed text-slate-700">{ai.answer}</p>

    {!!ai.steps?.length && (
      <div className="mt-3">
        <p className="mb-1 text-[11px] font-bold text-indigo-600">手順</p>
        <ol className="space-y-1.5">
          {ai.steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-[13px] font-bold leading-relaxed text-slate-700">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-600">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    )}

    {ai.caution && (
      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
        <p className="text-[12.5px] font-bold leading-relaxed text-amber-900">{ai.caution}</p>
      </div>
    )}

    {!!ai.sourceIds?.length && (
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-bold text-slate-400">根拠にした説明書</p>
        <div className="space-y-1.5">
          {ai.sourceIds.map((id) => {
            const it = byId(id);
            if (!it) return null;
            return <Choice key={id} onClick={() => onOpenItem(it)} title={it.title} />;
          })}
        </div>
      </div>
    )}

    <p className="mt-3 text-[11px] font-bold text-slate-400">
      ※ この回答は説明書をもとに作られています。内容に疑問があるときは、根拠の説明書をご確認ください。
    </p>
  </div>
);

const PanelHead = ({
  onReset, onClose, onDragStart,
}: {
  onReset: (() => void) | null;
  onClose: () => void;
  onDragStart: ((e: React.PointerEvent) => void) | null;
}) => (
  <div
    onPointerDown={onDragStart ?? undefined}
    className={`flex shrink-0 items-center gap-2 border-b border-[#ECEDF1] px-4 py-3 ${
      onDragStart ? 'cursor-grab touch-none select-none active:cursor-grabbing' : ''
    }`}
  >
    {onDragStart && <GripVertical className="-ml-1 h-4 w-4 shrink-0 text-slate-300" />}
    <RobotIcon className="h-4 w-4 shrink-0 text-indigo-600" />
    <span className="truncate text-sm font-bold text-slate-800">使い方を聞く</span>
    {onReset && (
      <button
        type="button" onClick={onReset} title="最初からやり直す"
        className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <RotateCcw className="h-3.5 w-3.5" />最初から
      </button>
    )}
    <button
      type="button" onClick={onClose} title="閉じる"
      className={`${onReset ? '' : 'ml-auto '}rounded p-1 text-slate-400 hover:bg-slate-100`}
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);

// ───────── 本体
export default function AiChatPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [faq, setFaq] = useState<{ id: string }[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>(firstMsgs);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const [box, setBox] = useState<Box>(() =>
    typeof window === 'undefined' ? { x: 0, y: 0, w: 420, h: 640 } : loadBox(),
  );
  const dragRef = useRef<{ mode: string; sx: number; sy: number; box: Box } | null>(null);

  const [tipDone, setTipDone] = useState(() => {
    try { return localStorage.getItem(TIP_KEY) === '1'; } catch { return true; }
  });
  const closeTip = () => {
    setTipDone(true);
    try { localStorage.setItem(TIP_KEY, '1'); } catch { /* 覚えられなくても動きます */ }
  };

  const beginDrag = (e: React.PointerEvent, mode: string) => {
    if (isMobile) return;
    if (mode === 'move' && (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { mode, sx: e.clientX, sy: e.clientY, box };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMoveStart = (e: React.PointerEvent) => beginDrag(e, 'move');
  const onResizeCorner = (e: React.PointerEvent) => beginDrag(e, 'corner');
  const onResizeBottom = (e: React.PointerEvent) => beginDrag(e, 'bottom');
  const onResizeTop = (e: React.PointerEvent) => beginDrag(e, 'top');
  const onResizeRight = (e: React.PointerEvent) => beginDrag(e, 'right');
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    const b = d.box;
    if (d.mode === 'move') return setBox(clampBox({ ...b, x: b.x + dx, y: b.y + dy }));
    if (d.mode === 'bottom') return setBox(clampBox({ ...b, h: b.h + dy }));
    if (d.mode === 'right') return setBox(clampBox({ ...b, w: b.w + dx }));
    if (d.mode === 'top') {
      // 上のふちを掴んだとき。★下端はその場に留め、上だけ伸び縮みさせます。
      const nh = Math.max(MIN_H, b.h - dy);
      return setBox(clampBox({ ...b, y: b.y + (b.h - nh), h: nh }));
    }
    return setBox(clampBox({ ...b, w: b.w + dx, h: b.h + dy }));
  };
  const onDragEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try { localStorage.setItem(BOX_KEY, JSON.stringify(box)); } catch { /* 保存できなくても動きます */ }
  };

  useEffect(() => {
    if (isMobile) return;
    const onResize = () => setBox((b) => clampBox(b));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isMobile]);

  // よく開かれた項目。取れなければ既定の並びのまま（初日でも空になりません）。
  useEffect(() => {
    let alive = true;
    portalApi<{ id: string }[]>('/ai-chat/faq?system=fukushi')
      .then((d) => { if (alive && Array.isArray(d)) setFaq(d); })
      .catch(() => { /* 取れなくても既定で動きます */ });
    return () => { alive = false; };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);

  const faqIds = useMemo(() => {
    const ranked = faq.map((f) => f.id).filter((id) => byId(id));
    return [...ranked, ...CHAT_DEFAULT_FAQ.filter((id) => !ranked.includes(id))].slice(0, 5);
  }, [faq]);

  const push = (m: Omit<Msg, 'id'>) => setMsgs((prev) => [...prev, { id: nextId(), ...m } as Msg]);
  const replace = (id: string, m: Partial<Msg>) =>
    setMsgs((prev) => prev.map((x) => (x.id === id ? ({ ...x, ...m } as Msg) : x)));

  // 記録します。失敗しても画面は止めません。
  const log = (payload: Record<string, unknown>) => {
    portalApi('/ai-chat/log', {
      method: 'POST',
      body: { systemKey: 'fukushi', pagePath: window.location.pathname, ...payload },
    }).catch(() => { /* 記録のために利用者を待たせません */ });
  };

  const openItem = (it: Flat, question: string) => {
    push({ role: 'bot', kind: 'item', item: it } as Omit<Msg, 'id'>);
    log({ question, answer: it.title, matchedIds: [it.id], resolved: true });
  };

  // ★4段目。説明書で見つからなかったときだけ、ここでAIを使います。
  const askAi = async (question: string) => {
    const id = nextId();
    setMsgs((prev) => [...prev, { id, role: 'bot', kind: 'thinking', phase: 'searching', asked: question }]);
    setBusy(true);
    const index = FLAT.map((x) => ({ id: x.id, cat: x.cat, title: x.title }));
    try {
      const sel = await portalApi<{ ids?: string[] }>('/ai-chat/select', {
        method: 'POST', body: { question, index }, timeout: 45000,
      });
      const ids = Array.isArray(sel?.ids) ? sel.ids : [];
      if (ids.length === 0) {
        replace(id, { kind: 'notfound', aiMsg: '' } as Partial<Msg>);
        log({ question, answer: '', matchedIds: [], resolved: false });
        return;
      }
      replace(id, { phase: 'thinking' } as Partial<Msg>);
      // 渡すのは本文だけ（画面用の body などは渡しません＝無駄な費用をかけません）。
      const items = ids
        .map(byId)
        .filter((x): x is Flat => !!x)
        .map(({ id: i, cat, title, can, steps, fields, terms, note, text }) =>
          ({ id: i, cat, title, can, steps, fields, terms, note, text }));
      const ans = await portalApi<AiAnswer>('/ai-chat/answer', {
        method: 'POST',
        body: { question, items, systemKey: 'fukushi', pagePath: window.location.pathname },
        timeout: 45000,
      });
      replace(id, ans?.found
        ? ({ kind: 'ai', ai: ans, asked: question } as Partial<Msg>)
        : ({ kind: 'notfound', aiMsg: '' } as Partial<Msg>));
    } catch (e) {
      const err = e as PortalApiError;
      const msg = [err.message, err.detail].filter(Boolean).join(' / ');
      // 503＝上限や停止。異常ではないので「見つかりませんでした」と同じ扱いで案内だけ添えます。
      replace(id, err.status === 503
        ? ({ kind: 'notfound', aiMsg: msg } as Partial<Msg>)
        : ({ kind: 'error', aiMsg: msg } as Partial<Msg>));
      log({ question, answer: '', matchedIds: [], resolved: false });
    } finally {
      setBusy(false);
    }
  };

  const submit = (text?: string) => {
    const raw = String(text ?? q).trim();
    if (!raw || busy) return;
    setQ('');
    push({ role: 'me', text: raw } as Omit<Msg, 'id'>);

    const whole = nrm(raw);
    const words = WORDS(whole);
    const terms = words.length ? words : [whole];
    const scored = FLAT.map((it) => ({ it, s: scoreOf(it, terms, whole) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    // ★本文にちらっと出るだけ（6点未満）なら、説明書で答えたことにせずAIに任せます。
    if (scored.length === 0 || scored[0].s < 6) { void askAi(raw); return; }

    const best = scored[0].s;
    const keep = scored.filter((x) => x.s >= Math.max(6, best * 0.5)).slice(0, 6);
    if (keep.length === 1) { openItem(keep[0].it, raw); return; }
    if (best - keep[1].s >= 7) { openItem(keep[0].it, raw); return; }

    const hits = keep.map((x) => x.it);
    push({ role: 'bot', kind: 'candidates', hits, asked: raw } as Omit<Msg, 'id'>);
    log({ question: raw, answer: '候補を提示', matchedIds: hits.map((x) => x.id), resolved: true });
  };

  const reset = () => { setMsgs(firstMsgs()); setQ(''); };

  // ★重なり順。不具合報告（100000）のすぐ下に置きます。
  const frameClass = isMobile
    ? 'fixed inset-0 z-[99000] flex flex-col bg-white'
    : 'fixed z-[99000] flex flex-col overflow-hidden rounded-xl border border-[#ECEDF1] bg-white shadow-2xl';
  const frameStyle = isMobile ? undefined : { left: box.x, top: box.y, width: box.w, height: box.h };

  const TIP_W = 250;
  const tipLeftFits = box.x - TIP_W - 14 >= 8;
  const tipStyle = tipLeftFits
    ? { left: box.x - TIP_W - 14, top: Math.min(box.y + 10, window.innerHeight - 190) }
    : { left: Math.max(8, box.x), top: Math.min(box.y + box.h + 12, window.innerHeight - 180) };

  return (
    <>
      {/* 動かし方のコツ。★窓の外に、窓を指す吹き出しとして出します。 */}
      {!tipDone && !isMobile && (
        <div style={{ ...tipStyle, width: TIP_W }} className="fixed z-[99100]">
          <div className="relative rounded-xl border border-[#ECEDF1] bg-white px-4 py-3.5 shadow-[0_10px_34px_rgba(20,20,28,.20)]">
            <span
              className={`absolute h-3 w-3 rotate-45 bg-white ${
                tipLeftFits ? '-right-1.5 top-7 border-r border-t border-[#ECEDF1]' : 'left-8 -top-1.5 border-l border-t border-[#ECEDF1]'
              }`}
            />
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-slate-800">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-indigo-50">
                <RobotIcon className="h-3.5 w-3.5 text-indigo-600" />
              </span>
              この窓、じつは動かせます。
            </p>
            <p className="mb-1.5 flex items-start gap-2 text-[12.5px] font-bold leading-relaxed text-slate-600">
              <Move className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              上の見出しをつまむと、好きな場所へ動かせます
            </p>
            <p className="flex items-start gap-2 text-[12.5px] font-bold leading-relaxed text-slate-600">
              <Maximize2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              ふちを引っぱると、縦にも横にも大きさを変えられます
            </p>
            <p className="mt-2 text-[11px] font-bold text-slate-400">置いた場所と大きさは覚えておきます。</p>
            <button
              type="button" onClick={closeTip}
              className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-indigo-700"
            >
              わかった
            </button>
          </div>
        </div>
      )}

      {/* ★背景は暗くしません＝説明書を見ながら実際に操作できます。 */}
      <aside
        className={frameClass} style={frameStyle}
        onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
      >
        <PanelHead onClose={onClose} onReset={msgs.length > 1 ? reset : null} onDragStart={isMobile ? null : onMoveStart} />

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {msgs.map((m) => {
            if (m.role === 'me') return <Me key={m.id} text={m.text} />;

            if (m.kind === 'welcome') {
              return (
                <Bot key={m.id}>
                  <p className="mb-2.5 text-[13px] font-bold text-slate-700">こんにちは。何にお困りですか？</p>
                  <p className="mb-1.5 text-[11px] font-bold text-slate-400">よくある質問</p>
                  <div className="mb-3">
                    <MoreList
                      items={faqIds.map(byId).filter((x): x is Flat => !!x)}
                      label="よくある質問"
                      render={(it) => <Choice key={it.id} onClick={() => openItem(it, '')} title={it.title} />}
                    />
                  </div>
                  <p className="mb-1.5 text-[11px] font-bold text-slate-400">分野から探す</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CHAT_ENTRIES.map((e) => (
                      <button
                        key={e.id} type="button" title={e.hint}
                        onClick={() => push({ role: 'bot', kind: 'entry', entry: e } as Omit<Msg, 'id'>)}
                        className="rounded-full border border-[#ECEDF1] bg-white px-2.5 py-1 text-[12px] font-bold text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600"
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </Bot>
              );
            }

            if (m.kind === 'entry') {
              const list = FLAT.filter((it) => m.entry.cats.includes(it.cat));
              return (
                <Bot key={m.id}>
                  <p className="text-[13px] font-bold text-slate-700">「{m.entry.name}」の中から選んでください。</p>
                  <p className="mb-2 text-[11px] font-bold text-slate-400">{m.entry.hint}</p>
                  <MoreList items={list} label="項目" render={(it) => <Choice key={it.id} onClick={() => openItem(it, '')} title={it.title} />} />
                </Bot>
              );
            }

            if (m.kind === 'candidates') {
              return (
                <Bot key={m.id}>
                  <p className="mb-2 text-[13px] font-bold text-slate-700">
                    近いものが{m.hits.length}つありました。どれについて知りたいですか？
                  </p>
                  <div className="space-y-1.5">
                    {m.hits.map((it) => (
                      <Choice key={it.id} onClick={() => openItem(it, m.asked)} title={it.title} sub={it.cat} />
                    ))}
                  </div>
                  <button
                    type="button" onClick={() => void askAi(m.asked)} disabled={busy}
                    className="mt-2 w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-[12.5px] font-bold text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
                  >
                    どれでもない（AIに聞いてみる）
                  </button>
                </Bot>
              );
            }

            if (m.kind === 'item') return <Bot key={m.id}><ItemBody item={m.item} onClose={onClose} /></Bot>;

            if (m.kind === 'thinking') {
              return (
                <Bot key={m.id}>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    <p className="text-[12.5px] font-bold text-slate-500">
                      {m.phase === 'searching' ? '説明書から探しています…' : '答えをまとめています…'}
                    </p>
                  </div>
                </Bot>
              );
            }

            if (m.kind === 'ai') {
              return <Bot key={m.id}><AiBody ai={m.ai} onOpenItem={(it) => openItem(it, m.asked)} /></Bot>;
            }

            if (m.kind === 'notfound') {
              return (
                <Bot key={m.id}>
                  <p className="mb-1 text-[13px] font-bold text-slate-700">見つかりませんでした</p>
                  <p className="text-[12.5px] font-bold leading-relaxed text-slate-500">
                    このことは説明書に載っていないようです。<br />
                    <span className="font-bold text-indigo-600">管理者にお問い合わせください。</span>
                  </p>
                  {m.aiMsg && <p className="mt-2 text-[11px] font-bold text-slate-400">{m.aiMsg}</p>}
                </Bot>
              );
            }

            if (m.kind === 'error') {
              return (
                <Bot key={m.id}>
                  <p className="mb-1 text-[13px] font-bold text-slate-700">うまく調べられませんでした</p>
                  <p className="text-[12.5px] font-bold leading-relaxed text-slate-500">
                    時間をおいてもう一度お試しください。<br />お急ぎのときは管理者にお問い合わせください。
                  </p>
                  {m.aiMsg && (
                    <p className="mt-3 break-all rounded-lg border border-[#ECEDF1] bg-white px-3 py-2 text-[10.5px] font-bold text-slate-400">
                      {m.aiMsg}
                    </p>
                  )}
                </Bot>
              );
            }

            return null;
          })}
          <div ref={endRef} />
        </div>

        {/* 入力欄は一番下。選択式を関所にせず、いつでも直接聞けます。 */}
        <div className="shrink-0 border-t border-[#ECEDF1] px-4 pb-2 pt-3">
          <div className="flex items-end gap-2">
            <input
              type="text" value={q} autoFocus disabled={busy}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={busy ? '調べています…' : '聞きたいことを入力（例：承認）'}
              className="flex-1 rounded-lg border border-[#ECEDF1] bg-slate-50 px-3.5 py-2.5 text-sm font-bold outline-none focus:border-indigo-400 focus:bg-white disabled:opacity-60"
            />
            <button
              type="button" onClick={() => submit()} disabled={busy || !q.trim()} title="送信"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2">
            <Link to="/help" onClick={onClose} className="text-[11px] font-bold text-slate-400 transition-colors hover:text-indigo-600">
              説明書をすべて見る →
            </Link>
          </div>
        </div>

        {/* 大きさを変える取っ手。★角だけだと狙いにくいので、上下と右のふちでも掴めます。 */}
        {!isMobile && (
          <>
            <div onPointerDown={onResizeTop} title="ドラッグで高さを変えられます"
              className="absolute left-2 right-2 top-0 h-1.5 cursor-ns-resize touch-none select-none transition-colors hover:bg-indigo-500/20" />
            <div onPointerDown={onResizeBottom} title="ドラッグで高さを変えられます"
              className="absolute bottom-0 left-2 right-4 h-1.5 cursor-ns-resize touch-none select-none transition-colors hover:bg-indigo-500/20" />
            <div onPointerDown={onResizeRight} title="ドラッグで幅を変えられます"
              className="absolute bottom-4 right-0 top-2 w-1.5 cursor-ew-resize touch-none select-none transition-colors hover:bg-indigo-500/20" />
            <div onPointerDown={onResizeCorner} title="ドラッグで大きさを変えられます"
              className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none select-none">
              <span className="absolute bottom-[3px] right-[3px] h-2 w-2 rounded-[1px] border-b-2 border-r-2 border-slate-300" />
            </div>
          </>
        )}
      </aside>
    </>
  );
}
