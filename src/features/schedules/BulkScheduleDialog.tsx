import { pad } from '@/lib/format';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '../../lib/errors';
import { useBulkSchedule } from './api';


export function BulkScheduleDialog({
  open,
  onOpenChange,
  userId,
  year,
  month, // 1-12
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  year: number;
  month: number;
}) {
  const bulk = useBulkSchedule();
  const [planIn, setPlanIn] = useState('09:00');
  const [planOut, setPlanOut] = useState('16:00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanIn('09:00');
      setPlanOut('16:00');
      setError('');
    }
  }, [open]);

  // 対象月の平日（月〜金）の日付を作る
  const weekdayDates = (): string[] => {
    const days = new Date(year, month, 0).getDate();
    const list: string[] = [];
    for (let d = 1; d <= days; d++) {
      const wd = new Date(year, month - 1, d).getDay();
      if (wd >= 1 && wd <= 5) list.push(`${year}-${pad(month)}-${pad(d)}`);
    }
    return list;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await bulk.mutateAsync({
        userId,
        dates: weekdayDates(),
        planIn,
        planOut,
      });
      toast.success(
        `平日を一括登録しました（新規 ${res.created} 件・既存はそのまま ${res.skipped} 件）`,
      );
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>平日を一括登録</DialogTitle>
          <DialogDescription>
            {year}年{month}月の<strong>平日（月〜金）すべて</strong>に、同じ時間の予定を登録します。
            すでに予定がある日はそのまま残します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-in">開始時刻</Label>
              <Input
                id="b-in"
                type="time"
                value={planIn}
                onChange={(e) => setPlanIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-out">終了時刻</Label>
              <Input
                id="b-out"
                type="time"
                value={planOut}
                onChange={(e) => setPlanOut(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bulk.isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={bulk.isPending}>
              {bulk.isPending ? '登録中…' : '一括登録'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
