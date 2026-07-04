import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Pencil, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BillingDetailDialog } from '../features/meals/BillingDetailDialog';
import { useUsersFacilityOptions } from '../features/users/api';
import {
  useMealBilling,
  useSetBillingNote,
  useSetPayment,
  type BillingRow,
} from '../features/meals/billingApi';
import { hasPermission, useMe } from '../features/auth/useMe';
import { formatDate } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

const pad = (n: number) => String(n).padStart(2, '0');
const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function MealBillingPage() {
  const { data: me } = useMe();
  const canPay = hasPermission(me, 'billing.payment');
  const { data: facilities } = useUsersFacilityOptions();
  const [facilityId, setFacilityId] = useState('');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useMealBilling(facilityId, year, month);
  const setPayment = useSetPayment();
  const setNote = useSetBillingNote();

  const [payTarget, setPayTarget] = useState<BillingRow | null>(null);
  const [payDate, setPayDate] = useState(todayStr());
  const [revertTarget, setRevertTarget] = useState<BillingRow | null>(null);
  const [noteTarget, setNoteTarget] = useState<BillingRow | null>(null);
  const [noteText, setNoteText] = useState('');
  const [detailTarget, setDetailTarget] = useState<BillingRow | null>(null);

  const totals = useMemo(() => {
    const rows = data?.rows ?? [];
    return {
      total: rows.reduce((s, r) => s + r.total, 0),
      tax: rows.reduce((s, r) => s + r.taxAmount, 0),
      paid: rows.filter((r) => r.paymentDate).length,
      count: rows.length,
    };
  }, [data]);

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    else if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const openPay = (row: BillingRow) => {
    setPayTarget(row);
    setPayDate(todayStr());
  };
  const confirmPay = async () => {
    if (!payTarget) return;
    try {
      await setPayment.mutateAsync({ userId: payTarget.userId, year, month, paymentDate: payDate });
      toast.success('入金を記録しました');
      setPayTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };
  const confirmRevert = async () => {
    if (!revertTarget) return;
    try {
      await setPayment.mutateAsync({ userId: revertTarget.userId, year, month, paymentDate: null });
      toast.success('未入金に戻しました');
      setRevertTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };
  const openNote = (row: BillingRow) => {
    setNoteTarget(row);
    setNoteText(row.note ?? '');
  };
  const saveNote = async () => {
    if (!noteTarget) return;
    try {
      await setNote.mutateAsync({ userId: noteTarget.userId, year, month, note: noteText });
      toast.success('メモを保存しました');
      setNoteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const canIssue = hasPermission(me, 'billing.issue');
  const hasActions = canPay || canIssue;
  const colCount = hasActions ? 8 : 7;

  const openInvoice = (userId?: string) => {
    const q = new URLSearchParams({
      facilityId,
      year: String(year),
      month: String(month),
      ...(userId ? { userId } : {}),
    });
    window.open(`/meal-billing/print?${q.toString()}`, '_blank');
  };

  return (
    <div>
      <PageHeader
        title="食事請求"
        description="利用者ごとの月次の食事料金・キャンセル料・消費税を集計し、入金状況を管理します（月末締め）。"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            items={Object.fromEntries((facilities ?? []).map((f) => [f.id, f.name]))}
            value={facilityId || null}
            onValueChange={(v) => setFacilityId((v as string) ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="店舗を選択" />
            </SelectTrigger>
            <SelectContent>
              {(facilities ?? []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-24 text-center text-sm font-semibold">
            {year}年 {month}月
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        {facilityId && data && (
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              請求合計 <span className="font-semibold text-foreground">{yen(totals.total)}</span>
              （うち消費税 {yen(totals.tax)}） / 入金 {totals.paid}・{totals.count}件
            </div>
            {canIssue && totals.count > 0 && (
              <Button variant="outline" size="sm" onClick={() => openInvoice()}>
                <Printer className="mr-1.5 size-4" />
                一括発行
              </Button>
            )}
          </div>
        )}
      </div>

      {facilityId && (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>利用者</TableHead>
                <TableHead className="text-right">食事(数)</TableHead>
                <TableHead className="text-right">食事料金</TableHead>
                <TableHead className="text-right">キャンセル料</TableHead>
                <TableHead className="text-right">税込合計</TableHead>
                <TableHead className="text-right">うち消費税</TableHead>
                <TableHead>入金</TableHead>
                {hasActions && <TableHead className="w-20 text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : (data?.rows ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                    この月の食事請求はありません。
                  </TableCell>
                </TableRow>
              ) : (
                (data?.rows ?? []).map((r) => (
                  <TableRow
                    key={r.userId}
                    className="cursor-pointer"
                    onClick={() => setDetailTarget(r)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {r.userName}
                      {r.note && (
                        <span className="ml-2 text-xs text-muted-foreground">（{r.note}）</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.mealCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{yen(r.mealTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.cancelTotal ? yen(r.cancelTotal) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{yen(r.total)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {yen(r.taxAmount)}
                    </TableCell>
                    <TableCell>
                      {r.paymentDate ? (
                        <button
                          type="button"
                          disabled={!canPay}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canPay) setRevertTarget(r);
                          }}
                          className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 disabled:cursor-default"
                        >
                          入金済 {formatDate(r.paymentDate)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canPay}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canPay) openPay(r);
                          }}
                          className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700 disabled:cursor-default"
                        >
                          未入金
                        </button>
                      )}
                    </TableCell>
                    {hasActions && (
                      <TableCell>
                        <div className="flex justify-end gap-0.5">
                          {canPay && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openNote(r);
                              }}
                              title="メモ"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {canIssue && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInvoice(r.userId);
                              }}
                              title="請求書"
                            >
                              <FileText className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 入金日ダイアログ */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>入金を記録</DialogTitle>
            <DialogDescription>
              {payTarget?.userName} さん・{year}年{month}月分（{yen(payTarget?.total ?? 0)}）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="pay-date">入金日</Label>
            <Input id="pay-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)} disabled={setPayment.isPending}>
              キャンセル
            </Button>
            <Button onClick={confirmPay} disabled={setPayment.isPending}>
              {setPayment.isPending ? '保存中…' : '入金済にする'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* メモダイアログ */}
      <Dialog open={!!noteTarget} onOpenChange={(o) => !o && setNoteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>請求メモ</DialogTitle>
            <DialogDescription>{noteTarget?.userName} さん・{year}年{month}月分</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="note">メモ</Label>
            <Input
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="振込・現金 など"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteTarget(null)} disabled={setNote.isPending}>
              キャンセル
            </Button>
            <Button onClick={saveNote} disabled={setNote.isPending}>
              {setNote.isPending ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BillingDetailDialog
        open={!!detailTarget}
        onOpenChange={(o) => !o && setDetailTarget(null)}
        userId={detailTarget?.userId ?? null}
        userName={detailTarget?.userName ?? ''}
        year={year}
        month={month}
      />

      <ConfirmDialog
        open={!!revertTarget}
        onOpenChange={(o) => !o && setRevertTarget(null)}
        title="未入金に戻しますか？"
        description={`${revertTarget?.userName ?? ''} さんの${year}年${month}月分の入金記録を取り消します。`}
        confirmLabel="未入金に戻す"
        onConfirm={confirmRevert}
      />
    </div>
  );
}
