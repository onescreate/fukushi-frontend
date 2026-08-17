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
import { breakOrderError, planOrderError } from '../../lib/timeRange';
import {
  breaksOf,
  practicePlaceOf,
  useAddScheduleDetail,
  useCreateSchedule,
  useDeleteSchedule,
  useRemoveScheduleDetail,
  useUpdateSchedule,
  type Schedule,
  type ScheduleDetail,
} from './api';

type DayType = 'commute' | 'practice';

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

  const [dayType, setDayType] = useState<DayType>('commute');
  const [practicePlace, setPracticePlace] = useState('');
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
      const place = practicePlaceOf(existing);
      setDayType(place ? 'practice' : 'commute');
      setPracticePlace(place ?? '');
      setPlanIn(existing?.planIn ?? '09:00');
      // 打刻で自動作成された予定は終了時刻が空。既定値を入れると開始より前になり得るため、
      // 開始があって終了が無いときは空のままにする（利用者に逆転した予定を作らせない）。
      setPlanOut(existing ? (existing.planOut ?? '') : '16:00');
      setNote(existing?.note ?? '');
      setBreaks(breaksOf(existing));
      setBreakOut('');
      setBreakIn('');
      setBreakNote('');
      setError('');
    }
  }, [open, existing]);

  const addBreak = async () => {
    if (!existing) return;
    if (!breakOut && !breakIn) return;
    const orderError = breakOrderError(breakOut, breakIn);
    if (orderError) {
      toast.error(orderError);
      return;
    }
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
    const orderError = planOrderError(planIn, planOut);
    if (orderError) {
      setError(orderError);
      return;
    }
    if (dayType === 'practice' && !practicePlace.trim()) {
      setError('実習先を入力してください。');
      return;
    }
    // 実習にすると中抜けは持たない（利用者の申請画面と同じ扱い）。空文字＝実習を解除。
    const place = dayType === 'practice' ? practicePlace.trim() : '';
    try {
      if (existing) {
        await update.mutateAsync({
          id: existing.id,
          data: {
            planIn,
            planOut: planOut || undefined,
            note: note || undefined,
            practicePlace: place,
          },
        });
        toast.success('予定を更新しました');
      } else {
        await create.mutateAsync({
          userId,
          planDate: date,
          planIn,
          planOut: planOut || undefined,
          note: note || undefined,
          practicePlace: place,
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
          {/* 種別（通所／実習）— 利用者の申請画面と同じ選び方に揃える */}
          <div className="space-y-1.5">
            <Label>種別</Label>
            <div className="inline-flex w-full rounded-lg border bg-muted/50 p-0.5">
              {(
                [
                  ['commute', '通所'],
                  ['practice', '実習'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDayType(v)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    dayType === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dayType === 'practice' && (
            <div className="space-y-1.5">
              <Label htmlFor="s-practice">
                実習先 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="s-practice"
                value={practicePlace}
                onChange={(e) => setPracticePlace(e.target.value)}
                placeholder="例：〇〇株式会社"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                実習の日は中抜けを登録できません（登録済みの中抜けは保存時に消えます）。
              </p>
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

          {existing && dayType === 'commute' && (
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
