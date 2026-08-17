import { PencilLine } from 'lucide-react';
import { formatDateTime } from '../../lib/format';

/**
 * 「この打刻は管理者が手で直したもの」と分かるバッジ。
 * 打刻データ一覧・ダッシュボードの来所者で使う。補正の記録が無ければ何も出さない。
 */
export function ManualEditBadge({
  at,
  byName,
  compact = false,
}: {
  /** 補正した日時（ISO文字列）。null なら非表示。 */
  at: string | null;
  /** 補正した職員の氏名 */
  byName: string | null;
  /** true なら文字を出さずアイコンだけ（狭い場所用） */
  compact?: boolean;
}) {
  if (!at) return null;
  const who = byName ?? '職員';
  const title = `管理者が補正：${who}（${formatDateTime(at)}）`;
  return (
    <span
      title={title}
      aria-label={title}
      className="inline-flex shrink-0 items-center gap-1 rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700"
    >
      <PencilLine className="size-3" />
      {!compact && '手修正'}
    </span>
  );
}
