import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
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
  useBulkDecideMeals,
  useDecideMeal,
  usePendingMeals,
} from '../features/meals/reservationApi';
import {
  MEAL_REJECT_PRESETS,
  RejectReasonDialog,
} from '../components/RejectReasonDialog';
import { UserNameFilter, matchesName } from '../components/UserNameFilter';
import { getApiErrorMessage } from '../lib/errors';
import { formatDate, yen } from '../lib/format';

export default function MealApprovalsPage() {
  const { data, isLoading } = usePendingMeals();
  const decide = useDecideMeal();
  const bulkDecide = useBulkDecideMeals();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // 却下の理由入力。ids に入れた申請をまとめて却下する。
  const [rejecting, setRejecting] = useState<string[] | null>(null);
  // 利用者名で絞り込む
  const [nameQuery, setNameQuery] = useState('');

  const allRows = useMemo(() => data ?? [], [data]);
  // 絞り込み後の一覧。まとめて承認/却下も「いま表示されている行」だけを対象にする。
  const rows = useMemo(
    () => allRows.filter((m) => matchesName(m.userName, nameQuery)),
    [allRows, nameQuery],
  );

  const busy = decide.isPending || bulkDecide.isPending;
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
      setRejecting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="食事承認"
        description="利用者から申請された食事の予約・取消を承認・却下します。"
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
              <TableHead>利用日</TableHead>
              <TableHead>申請</TableHead>
              <TableHead className="text-right">金額</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  読み込み中…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  {allRows.length > 0
                    ? `「${nameQuery}」に一致する利用者の申請はありません。`
                    : '承認待ちの食事申請はありません。'}
                </TableCell>
              </TableRow>
            )}
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggle(m.id)}
                    aria-label={`${m.userName} を選択`}
                    className="size-4 cursor-pointer accent-indigo-600"
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {m.userName}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(m.mealDate)}
                </TableCell>
                <TableCell>
                  {m.requestType === 'cancel' ? (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                      取消（キャンセル料あり）
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      予約
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {yen(m.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => run([m.id], 'approve')}
                      disabled={busy}
                    >
                      <Check className="size-4" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejecting([m.id])}
                      disabled={busy}
                    >
                      <X className="size-4" />
                      却下
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* 却下の理由入力（利用者の画面にそのまま表示される） */}
      <RejectReasonDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        count={rejecting?.length ?? 0}
        busy={busy}
        onSubmit={(reason) => rejecting && run(rejecting, 'reject', reason)}
        targetLabel="食事の申請"
        presets={MEAL_REJECT_PRESETS}
        placeholder="例：食事の申込み締切を過ぎています"
      />
    </div>
  );
}
