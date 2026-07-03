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
import {
  useCreateSchedule,
  useDeleteSchedule,
  useUpdateSchedule,
  type Schedule,
} from './api';

export function ScheduleDayDialog({
  open,
  onOpenChange,
  userId,
  date,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  date: string; // YYYY-MM-DD
  existing: Schedule | null;
}) {
  const create = useCreateSchedule();
  const update = useUpdateSchedule();
  const del = useDeleteSchedule();

  const [planIn, setPlanIn] = useState('09:00');
  const [planOut, setPlanOut] = useState('16:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanIn(existing?.planIn ?? '09:00');
      setPlanOut(existing?.planOut ?? '16:00');
      setNote(existing?.note ?? '');
      setError('');
    }
  }, [open, existing]);

  const busy = create.isPending || update.isPending || del.isPending;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (existing) {
        await update.mutateAsync({
          id: existing.id,
          data: { planIn, planOut, note: note || undefined },
        });
        toast.success('予定を更新しました');
      } else {
        await create.mutateAsync({
          userId,
          planDate: date,
          planIn,
          planOut,
          note: note || undefined,
        });
        toast.success('予定を登録しました');
      }
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    try {
      await del.mutateAsync(existing.id);
      toast.success('予定を削除しました');
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? '予定を編集' : '予定を登録'}</DialogTitle>
          <DialogDescription>{date} の通所予定</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-in">開始時刻</Label>
              <Input
                id="s-in"
                type="time"
                value={planIn}
                onChange={(e) => setPlanIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-out">終了時刻</Label>
              <Input
                id="s-out"
                type="time"
                value={planOut}
                onChange={(e) => setPlanOut(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-note">メモ（任意）</Label>
            <Input
              id="s-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            {existing ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={busy}
              >
                削除
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={busy}>
                保存
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
