import { useMemo, useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { DetailDialog } from '../components/DetailDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useBulkDecideSchedules,
  useDecideSchedule,
  usePendingSchedules,
  type PendingSchedule,
} from '../features/schedules/approvalApi';
import { RejectReasonDialog } from '../components/RejectReasonDialog';
import { breaksOf, practicePlaceOf } from '../features/schedules/api';
import { UserNameFilter, matchesName } from '../components/UserNameFilter';
import { getApiErrorMessage } from '../lib/errors';
import { formatDate } from '../lib/format';
import { isReversedRange } from '../lib/timeRange';

const userName = (s: PendingSchedule) => `${s.user.lastName} ${s.user.firstName}`;

/** 開始〜終了の表示（逆転していれば警告マークを添える）。 */
function TimeRange({ from, to }: { from: string | null; to: string | null }) {
  const reversed = isReversedRange(from, to);
  return (
    <span className={reversed ? 'font-medium text-amber-700' : undefined}>
      {from ?? '—'}
      {from || to ? '〜' : ''}
      {to ?? ''}
      {reversed && (
        <AlertTriangle
          className="ml-1 inline size-3.5 align-text-top text-amber-600"
          aria-label="開始と終了が逆になっています"
        />
      )}
    </span>
  );
}

/** 申請内容の要約（実習先・中抜け・連絡事項）。表の1列に収める。 */
function summarize(s: PendingSchedule): string {
  const parts: string[] = [];
  const place = practicePlaceOf(s);
  if (place) parts.push(`実習先：${place}`);
  const breaks = breaksOf(s);
  for (const b of breaks) {
    const time = `${b.plannedOut ?? '—'}→${b.plannedIn ?? '—'}`;
    parts.push(b.note ? `中抜け ${time}（${b.note}）` : `中抜け ${time}`);
  }
  if (s.note) parts.push(s.note);
  return parts.join(' / ');
}

export default function ApprovalsPage() {
  const { data, isLoading } = usePendingSchedules();
  const decide = useDecideSchedule();
  const bulkDecide = useBulkDecideSchedules();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<PendingSchedule | null>(null);
  // 却下の理由入力。ids に入れた予定をまとめて却下する。
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  // 利用者名で絞り込む（申請が多いときに目的の人を探しやすくする）
  const [nameQuery, setNameQuery] = useState('');

  const allRows = useMemo(() => data ?? [], [data]);
  // 絞り込み後の一覧。まとめて承認/却下も「いま表示されている行」だけを対象にする。
  const rows = useMemo(
    () => allRows.filter((s) => matchesName(userName(s), nameQuery)),
    [allRows, nameQuery],
  );
  const busy = decide.isPending || bulkDecide.isPending;
  // 表示中の行だけを選択対象にする（承認して消えた行の選択は無視する）
  const selectedIds = rows.map((r) => r.id).filter((id) => selected.has(id));
  const allChecked = rows.length > 0 && selectedIds.length === rows.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));

  /** 1件・複数件をまとめて処理する共通口（1件でも同じ経路にする）。 */
  const run = async (
    ids: string[],
    decision: 'approve' | 'reject',
    reason?: string,
  ) => {
    if (ids.length === 0) return;
    try {
      if (ids.length === 1) {
        await decide.mutateAsync({ id: ids[0], decision, reason });
        toast.success(decision === 'approve' ? '承認しました' : '却下しました');
      } else {
        const r = await bulkDecide.mutateAsync({ ids, decision, reason });
        const label = decision === 'approve' ? '承認' : '却下';
        toast.success(`${r.done}件を${label}しました`);
        if (r.failed.length) {
          toast.warning(
            `${r.failed.length}件は処理できませんでした：${r.failed[0].message}`,
          );
        }
      }
      setSelected(new Set());
      setDetail(null);
      setRejecting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const detailRows = detail
    ? [
        { label: '利用者', value: userName(detail) },
        { label: '日付', value: formatDate(detail.planDate) },
        {
          label: '種別',
          value: practicePlaceOf(detail) ? '実習' : '通所',
        },
        ...(practicePlaceOf(detail)
          ? [{ label: '実習先', value: practicePlaceOf(detail) }]
          : []),
        {
          label: '時間',
          value: <TimeRange from={detail.planIn} to={detail.planOut} />,
        },
        {
          label: '中抜け',
          value:
            breaksOf(detail).length === 0 ? (
              'なし'
            ) : (
              <div className="space-y-1">
                {breaksOf(detail).map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-amber-700">
                      {b.plannedOut ?? '—'}→{b.plannedIn ?? '—'}
                    </span>
                    {b.note && (
                      <span className="text-xs text-muted-foreground">
                        {b.note}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ),
        },
        { label: '連絡事項', value: detail.note },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="予定承認"
        description="利用者から申請された予定を承認・却下します。行をクリックすると申請内容を確認できます。"
        action={
          <UserNameFilter
            value={nameQuery}
            onChange={setNameQuery}
            matched={rows.length}
            total={allRows.length}
          />
        }
      />

      {/* まとめて処理のバー（選択があるときだけ出す） */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-semibold">
            {selectedIds.length}件を選択中
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            選択を解除
          </button>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={() => run(selectedIds, 'approve')}
              disabled={busy}
            >
              <Check className="size-4" />
              まとめて承認
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejecting(selectedIds)}
              disabled={busy}
            >
              <X className="size-4" />
              まとめて却下
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  disabled={rows.length === 0}
                  aria-label="すべて選択"
                  className="size-4 cursor-pointer accent-indigo-600"
                />
              </TableHead>
              <TableHead>利用者</TableHead>
              <TableHead>日付</TableHead>
              <TableHead>種別</TableHead>
              <TableHead>時間</TableHead>
              <TableHead>申請内容</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  読み込み中…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {allRows.length > 0
                    ? `「${nameQuery}」に一致する利用者の申請はありません。`
                    : '承認待ちの予定はありません。'}
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => {
              const place = practicePlaceOf(s);
              const summary = summarize(s);
              return (
                <TableRow
                  key={s.id}
                  onClick={() => setDetail(s)}
                  className="cursor-pointer"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      aria-label={`${userName(s)} を選択`}
                      className="size-4 cursor-pointer accent-indigo-600"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {userName(s)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(s.planDate)}
                  </TableCell>
                  <TableCell>
                    {place ? (
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        実習
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        通所
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    <TimeRange from={s.planIn} to={s.planOut} />
                  </TableCell>
                  <TableCell className="max-w-80 truncate text-xs text-muted-foreground">
                    {summary || '—'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => run([s.id], 'approve')}
                        disabled={busy}
                      >
                        <Check className="size-4" />
                        承認
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejecting([s.id])}
                        disabled={busy}
                      >
                        <X className="size-4" />
                        却下
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* 申請内容の詳細（行クリック） */}
      <DetailDialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        title="申請内容"
        description={
          detail ? `${userName(detail)} / ${formatDate(detail.planDate)}` : ''
        }
        rows={detailRows}
        actions={
          detail ? (
            <>
              <Button
                variant="outline"
                onClick={() => setRejecting([detail.id])}
                disabled={busy}
              >
                <X className="size-4" />
                却下
              </Button>
              <Button onClick={() => run([detail.id], 'approve')} disabled={busy}>
                <Check className="size-4" />
                承認
              </Button>
            </>
          ) : undefined
        }
      />

      {/* 却下の理由入力 */}
      <RejectReasonDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        count={rejecting?.length ?? 0}
        busy={busy}
        onSubmit={(reason) => rejecting && run(rejecting, 'reject', reason)}
      />
    </div>
  );
}
