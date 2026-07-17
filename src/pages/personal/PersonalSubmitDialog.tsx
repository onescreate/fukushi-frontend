import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '../../lib/errors';
import { useMySubmit } from '../../features/schedules/myApi';
import type { Schedule } from '../../features/schedules/api';

interface BreakRow {
  plannedOut: string;
  plannedIn: string;
}

export function PersonalSubmitDialog({
  open,
  onOpenChange,
  date,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existing: Schedule | null;
}) {
  const submit = useMySubmit();
  const [planIn, setPlanIn] = useState('09:00');
  const [planOut, setPlanOut] = useState('16:00');
  const [note, setNote] = useState('');
  const [breaks, setBreaks] = useState<BreakRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanIn(existing?.planIn ?? '09:00');
      setPlanOut(existing?.planOut ?? '16:00');
      setNote(existing?.note ?? '');
      setBreaks(
        (existing?.details ?? [])
          .filter((d) => d.eventType === 'break_out')
          .map((d) => ({
            plannedOut: d.plannedOut ?? '',
            plannedIn: d.plannedIn ?? '',
          })),
      );
      setError('');
    }
  }, [open, existing]);

  const addBreak = () =>
    setBreaks((b) => [...b, { plannedOut: '', plannedIn: '' }]);
  const removeBreak = (i: number) =>
    setBreaks((b) => b.filter((_, idx) => idx !== i));
  const setBreak = (i: number, key: keyof BreakRow, val: string) =>
    setBreaks((b) => b.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await submit.mutateAsync({
        planDate: date,
        planIn,
        planOut,
        note: note || undefined,
        breaks: breaks
          .filter((b) => b.plannedOut || b.plannedIn)
          .map((b) => ({
            plannedOut: b.plannedOut || undefined,
            plannedIn: b.plannedIn || undefined,
          })),
      });
      toast.success(
        res.autoApproved ? '予定を登録しました' : '予定を申請しました（承認待ち）',
      );
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[26rem]">
        <DialogHeader>
          <DialogTitle>{date} の通所予定</DialogTitle>
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

          {/* 中抜け */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">中抜け（外出）</span>
              <button
                type="button"
                onClick={addBreak}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 active:bg-slate-200"
              >
                <Plus className="size-3.5" /> 追加
              </button>
            </div>
            {breaks.length === 0 && (
              <p className="text-xs text-slate-400">外出予定があれば追加してください。</p>
            )}
            {breaks.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={b.plannedOut}
                  onChange={(e) => setBreak(i, 'plannedOut', e.target.value)}
                  className="h-11 flex-1 text-base"
                  aria-label="外出"
                />
                <span className="text-slate-400">→</span>
                <Input
                  type="time"
                  value={b.plannedIn}
                  onChange={(e) => setBreak(i, 'plannedIn', e.target.value)}
                  className="h-11 flex-1 text-base"
                  aria-label="戻り"
                />
                <button
                  type="button"
                  onClick={() => removeBreak(i)}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 active:bg-slate-100"
                  aria-label="削除"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-500">連絡事項（任意）</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} className="h-11" />
          </label>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submit.isPending}
              className="h-12 flex-1"
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submit.isPending} className="h-12 flex-1">
              {submit.isPending ? '送信中…' : '申請する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
