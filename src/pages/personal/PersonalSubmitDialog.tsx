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
import { useMySubmit } from '../../features/schedules/myApi';
import type { Schedule } from '../../features/schedules/api';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanIn(existing?.planIn ?? '09:00');
      setPlanOut(existing?.planOut ?? '16:00');
      setNote(existing?.note ?? '');
      setError('');
    }
  }, [open, existing]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await submit.mutateAsync({
        planDate: date,
        planIn,
        planOut,
        note: note || undefined,
      });
      toast.success(
        res.autoApproved
          ? '予定を登録しました（承認されました）'
          : '予定を申請しました（承認待ち）',
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
          <DialogTitle>{date} の通所予定</DialogTitle>
          <DialogDescription>
            通所したい時間を入力して申請してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ps-in">開始時刻</Label>
              <Input
                id="ps-in"
                type="time"
                value={planIn}
                onChange={(e) => setPlanIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ps-out">終了時刻</Label>
              <Input
                id="ps-out"
                type="time"
                value={planOut}
                onChange={(e) => setPlanOut(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ps-note">連絡事項（任意）</Label>
            <Input
              id="ps-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submit.isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submit.isPending}>
              {submit.isPending ? '送信中…' : '申請する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
