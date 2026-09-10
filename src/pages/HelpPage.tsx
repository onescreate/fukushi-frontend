import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  X,
  BookOpen,
  Compass,
  Building2,
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Utensils,
  Activity,
  Database,
  UserRound,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { TOPICS, CATS, blockText, type Audience } from '../config/helpTopics';
import TopicBody from '../components/help/HelpBlocks';

// ============================================================================
// 説明書（ヘルプ・使い方）
//
// 中身は config/helpTopics.ts に「データとして」持っています。
// 説明を足したいときは、そこに1件追加するだけです（検索も読者の絞り込みも自動で効きます）。
// 「質問はこちら」（AIチャット）も同じデータを読みます。
// ============================================================================

const AUD: Record<Audience, { label: string; cls: string }> = {
  beginner: { label: 'はじめて', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ops: { label: '毎日の担当', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  admin: { label: '管理者', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

// 分類のアイコン。★表示名は config/helpTopics.ts の CATS が唯一の置き場です。
const CAT_ICON: Record<string, LucideIcon> = {
  intro: BookOpen,
  flow: Compass,
  setup: Building2,
  daily: LayoutDashboard,
  kiosk: ClipboardList,
  schedule: CalendarDays,
  meal: Utensils,
  record: Activity,
  master: Database,
  personal: UserRound,
  faq: HelpCircle,
};

export default function HelpPage() {
  const [q, setQ] = useState('');
  const [aud, setAud] = useState<Audience | ''>('');
  const location = useLocation();

  // 「質問はこちら」の『説明書で開く』から /help?id=xxx で来たときは、その項目まで運びます。
  //   ★描画が終わってから探します（まだ無い要素は掴めません）。
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(`topic-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
  }, [location.search]);

  const indexed = useMemo(
    () =>
      TOPICS.map((t) => ({
        ...t,
        _text: `${t.title} ${t.kw} ${t.body.map(blockText).join(' ')}`.toLowerCase(),
      })),
    [],
  );

  const kw = q.trim().toLowerCase();
  const hits = useMemo(
    () =>
      indexed.filter((t) => {
        if (aud && !t.aud.includes(aud)) return false;
        if (!kw) return true;
        return t._text.includes(kw);
      }),
    [indexed, kw, aud],
  );

  const searching = !!kw || !!aud;
  const go = (catId: string) =>
    document.getElementById(`cat-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const Card = ({ t }: { t: (typeof indexed)[number] }) => (
    <article
      id={`topic-${t.id}`}
      className="scroll-mt-6 space-y-3 rounded-xl border border-[#ECEDF1] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,28,.04)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[14.5px] font-bold text-slate-900">{t.title}</h3>
        {t.aud.map((a) => (
          <span key={a} className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${AUD[a].cls}`}>
            {AUD[a].label}
          </span>
        ))}
      </div>
      <TopicBody body={t.body} />
    </article>
  );

  return (
    <div>
      <PageHeader title="ヘルプ・使い方" description="この画面で、すべての使い方が分かります" />

      {/* 検索・読者の絞り込み */}
      <div className="sticky top-2 z-20 mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="キーワードで検索（例：承認 / 却下 / 打刻 / 食事 / 請求 / 実習）"
            className="w-full rounded-xl border border-[#ECEDF1] bg-white py-2.5 pl-10 pr-10 text-[13.5px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(20,20,28,.04)] outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-indigo-400"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400">読者：</span>
          {([['', 'すべて'], ['beginner', 'はじめて'], ['ops', '毎日の担当'], ['admin', '管理者']] as const).map(
            ([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setAud(v as Audience | '')}
                className={`rounded-full border px-2.5 py-1 text-[12px] font-bold transition-colors ${
                  aud === v
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-[#ECEDF1] bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      {searching ? (
        <div className="space-y-3">
          <div className="text-[13px] font-bold text-slate-500">
            {hits.length} 件見つかりました
            {q && (
              <>
                ：「<span className="text-indigo-600">{q}</span>」
              </>
            )}
          </div>
          {hits.length === 0 ? (
            <div className="rounded-xl border border-[#ECEDF1] bg-white py-16 text-center text-[13px] font-bold text-slate-400">
              該当なし。別の言葉でお試しください（例：承認 / 端末 / PIN / 加算）。
            </div>
          ) : (
            hits.map((t) => <Card key={t.id} t={t} />)
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 分類へのジャンプ */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATS.filter((c) => TOPICS.some((t) => t.cat === c.id)).map((c) => {
              const Icon = CAT_ICON[c.id] ?? BookOpen;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(c.id)}
                  className="flex items-center gap-2 rounded-xl border border-[#ECEDF1] bg-white px-3 py-2.5 text-left text-[12.5px] font-bold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <Icon className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>

          {CATS.map((c) => {
            const items = indexed.filter((t) => t.cat === c.id);
            if (!items.length) return null;
            const Icon = CAT_ICON[c.id] ?? BookOpen;
            return (
              <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-indigo-50">
                    <Icon className="h-4.5 w-4.5 text-indigo-600" />
                  </div>
                  <h2 className="text-[16px] font-bold tracking-tight text-slate-900">{c.name}</h2>
                  <span className="text-[11px] font-bold text-slate-400">{items.length}件</span>
                </div>
                {items.map((t) => <Card key={t.id} t={t} />)}
              </section>
            );
          })}
        </div>
      )}

      <p className="py-8 text-center text-[12px] font-bold text-slate-400">
        分からないことが見つからないときは、管理者にお問い合わせください。
      </p>
    </div>
  );
}
