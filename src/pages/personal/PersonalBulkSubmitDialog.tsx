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
import { getApiErrorMessage } from '../../lib/errors';
import { useMyBulkSubmit } from '../../features/schedules/myApi';

/** 選択した複数日に、同じ通所時間でまとめて予定を登録するダイアログ。 */
export function PersonalBulkSubmitDialog({
  open,
  onOpenChange,
  dates,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dates: string[];
  onDone: () => void;
}) {
  const bulk = useMyBulkSubmit();
  const [planIn, setPlanIn] = useState('10:00');
  const [planOut, setPlanOut] = useState('15:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanIn('10:00');
      setPlanOut('15:00');
      setNote('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const r = await bulk.mutateAsync({
        dates,
        planIn,
        planOut,
        note: note || undefined,
      });
      const parts: string[] = [];
      if (r.approved) parts.push(`登録 ${r.approved}日`);
      if (r.pending) parts.push(`申請 ${r.pending}日`);
      toast.success(
        (parts.join('、') || '処理しました') + ' を受け付けました',
      );
      onOpenChange(false);
      onDone();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[26rem]">
        <DialogHeader>
          <DialogTitle>選択した {dates.length}日 をまとめて登録</DialogTitle>
          <DialogDescription>
            選んだすべての日に、同じ通所時間で予定を登録します。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500">通所（開始）</span>
              <Input
                type="time"
                value={planIn}
                onChange={(e) => setPlanIn(e.target.value)}
                className="h-12 text-base"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500">退所（終了）</span>
              <Input
                type="time"
                value={planOut}
                onChange={(e) => setPlanOut(e.target.value)}
                className="h-12 text-base"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-500">
              連絡事項（任意・全日共通）
            </span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11"
            />
          </label>
          <p className="text-xs text-slate-400">
            中抜けは含まれません。個別の中抜けは、登録後に日付をタップして追加してください。
          </p>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={bulk.isPending}
              className="h-12 flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={bulk.isPending || dates.length === 0}
              className="h-12 flex-1"
            >
              {bulk.isPending ? '送信中…' : `${dates.length}日を登録`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
