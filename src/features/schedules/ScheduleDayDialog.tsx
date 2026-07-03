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
import { Plus, X } from 'lucide-react';
import { getApiErrorMessage } from '../../lib/errors';
import {
  useAddScheduleDetail,
  useCreateSchedule,
  useDeleteSchedule,
  useRemoveScheduleDetail,
  useUpdateSchedule,
  type Schedule,
  type ScheduleDetail,
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
  const addDetail = useAddScheduleDetail();
  const removeDetail = useRemoveScheduleDetail();

  const [planIn, setPlanIn] = useState('09:00');
  const [planOut, setPlanOut] = useState('16:00');
  const [note, setNote] = useState('');
  const [breaks, setBreaks] = useState<ScheduleDetail[]>([]);
  const [breakOut, setBreakOut] = useState('');
  const [breakIn, setBreakIn] = useState('');
  const [breakNote, setBreakNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanIn(existing?.planIn ?? '09:00');
      setPlanOut(existing?.planOut ?? '16:00');
      setNote(existing?.note ?? '');
      setBreaks(
        (existing?.details ?? []).filter((d) => d.eventType === 'break_out'),
      );
      setBreakOut('');
      setBreakIn('');
      setBreakNote('');
      setError('');
    }
  }, [open, existing]);

  const addBreak = async () => {
    if (!existing) return;
    if (!breakOut && !breakIn) return;
    try {
      const d = await addDetail.mutateAsync({
        scheduleId: existing.id,
        plannedOut: breakOut || undefined,
        plannedIn: breakIn || undefined,
        note: breakNote || undefined,
      });
      setBreaks((prev) => [...prev, d]);
      setBreakOut('');
      setBreakIn('');
      setBreakNote('');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const deleteBreak = async (id: string) => {
    try {
      await removeDetail.mutateAsync(id);
      setBreaks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

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

          {existing && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <Label>中抜け（外出・戻り）</Label>
              {breaks.length > 0 && (
                <div className="space-y-1.5">
                  {breaks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="font-mono">
                          {b.plannedOut ?? '—'} 〜 {b.plannedIn ?? '—'}
                        </span>
                        {b.note && (
                          <span className="ml-2 text-muted-foreground">
                            {b.note}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteBreak(b.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        title="削除"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={breakOut}
                  onChange={(e) => setBreakOut(e.target.value)}
                  className="flex-1"
                  aria-label="外出時刻"
                />
                <span className="text-sm text-muted-foreground">〜</span>
                <Input
                  type="time"
                  value={breakIn}
                  onChange={(e) => setBreakIn(e.target.value)}
                  className="flex-1"
                  aria-label="戻り時刻"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={addBreak}
                  disabled={addDetail.isPending || (!breakOut && !breakIn)}
                  title="中抜けを追加"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <Input
                value={breakNote}
                onChange={(e) => setBreakNote(e.target.value)}
                placeholder="理由・行き先（通院、ハローワーク等・任意）"
                className="text-sm"
              />
            </div>
          )}

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
