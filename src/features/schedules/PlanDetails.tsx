/**
 * 利用者が申請した「実習先」「中抜け（時刻＋用件）」の表示。
 * ダッシュボードと打刻データ一覧で共通に使う。
 * どちらも無ければ何も描画しない。
 */
export interface PlanBreak {
  plannedOut: string | null;
  plannedIn: string | null;
  note: string | null;
}

const breakText = (b: PlanBreak) =>
  `${b.plannedOut ?? '—'}→${b.plannedIn ?? '—'}${b.note ? `（${b.note}）` : ''}`;

export function PlanDetails({
  practicePlace,
  breaks,
  /** true なら1行に収め、詳細はカーソルを合わせたときだけ出す（表の狭い列用） */
  compact = false,
}: {
  practicePlace: string | null;
  breaks: PlanBreak[];
  compact?: boolean;
}) {
  if (!practicePlace && breaks.length === 0) return null;

  if (compact) {
    return (
      <span className="ml-1 inline-flex flex-wrap items-center gap-1 align-middle">
        {practicePlace && (
          <span
            title={`実習先：${practicePlace}`}
            className="rounded bg-violet-100 px-1 py-0.5 text-[10px] font-bold text-violet-700"
          >
            実習
          </span>
        )}
        {breaks.length > 0 && (
          <span
            title={breaks.map((b) => `中抜け ${breakText(b)}`).join('\n')}
            className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700"
          >
            中抜け{breaks.length > 1 ? `×${breaks.length}` : ''}
          </span>
        )}
      </span>
    );
  }

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {practicePlace && (
        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
          実習：{practicePlace}
        </span>
      )}
      {breaks.map((b, i) => (
        <span key={i} className="text-[10px] font-medium text-amber-700">
          中抜け {b.plannedOut ?? '—'}→{b.plannedIn ?? '—'}
          {b.note && <span className="text-slate-400">（{b.note}）</span>}
        </span>
      ))}
    </div>
  );
}
