import { Link } from 'react-router-dom';
import { ChevronRight, Lightbulb, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Block } from '../../config/helpTopics';

// 説明書の本文（1かたまり＝1ブロック）の描き方。
//
// ★ここに置いた理由
//   説明書のページ（pages/HelpPage.tsx）と「質問はこちら」（AIチャット）の両方から、
//   同じ見た目で出すためです。片方にだけ描き方があると、チャットでは箇条書きや
//   注意の囲みが消えて読みにくくなります。
//
// 中身（データ）は config/helpTopics.ts です。

const CODE =
  'font-mono text-[12.5px] bg-slate-900 text-slate-100 rounded-lg px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap break-words';

export function BlockView({ b }: { b: Block }) {
  if (typeof b === 'string') return <p className="text-[13px] leading-relaxed text-slate-600">{b}</p>;
  if ('h' in b) return <h4 className="mt-1 text-[13.5px] font-bold text-slate-800">{b.h}</h4>;
  if ('ul' in b)
    return (
      <ul className="space-y-1.5">
        {b.ul.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-600">
            <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    );
  if ('ol' in b)
    return (
      <div className="space-y-2.5">
        {b.ol.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-[12px] font-bold tabular-nums text-white">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="text-[13px] font-bold text-slate-800">{s.t}</div>
              {s.d && <div className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{s.d}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  if ('kv' in b)
    return (
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-[#ECEDF1]">
        {b.kv.map((x, i) => (
          <div key={i} className="flex gap-3 px-3.5 py-2 text-[13px]">
            <div className="w-44 shrink-0 break-words font-bold text-slate-700">{x.k}</div>
            <div className="min-w-0 flex-1 break-words text-slate-500">{x.v}</div>
          </div>
        ))}
      </div>
    );
  if ('table' in b)
    return (
      <div className="overflow-x-auto rounded-xl border border-[#ECEDF1]">
        <table className="w-full whitespace-nowrap text-left text-[12.5px]">
          <thead className="bg-slate-50 font-bold text-slate-500">
            <tr>
              {b.table.head.map((h, i) => (
                <th key={i} className="px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
            {b.table.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-bold text-slate-800' : ''}`}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  if ('tip' in b)
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div className="text-[12.5px] font-medium leading-relaxed text-emerald-900">{b.tip}</div>
      </div>
    );
  if ('warn' in b)
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="text-[12.5px] font-medium leading-relaxed text-amber-900">{b.warn}</div>
      </div>
    );
  if ('code' in b) return <pre className={CODE}>{b.code}</pre>;
  if ('link' in b)
    return (
      <Link to={b.link.to} className="inline-flex items-center gap-1 text-[13px] font-bold text-indigo-600 hover:underline">
        <ArrowRight className="h-3.5 w-3.5" />
        {b.link.label}
      </Link>
    );
  return null;
}

// 1項目の本文ぜんぶ。★間隔もここで決めます（2か所で食い違わせない）。
export default function TopicBody({ body }: { body: Block[] }) {
  return (
    <div className="space-y-3">
      {(body ?? []).map((b, i) => (
        <BlockView key={i} b={b} />
      ))}
    </div>
  );
}
