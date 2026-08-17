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
import { formatDateTime } from '../../lib/format';
import { clockOrderError } from '../../lib/timeRange';
import { useManualAttendance, type RosterRow } from './api';

export function ManualAttendanceDialog({
  open,
  onOpenChange,
  row,
  date,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: RosterRow | null;
  date: string;
}) {
  const manual = useManualAttendance();
  const [status, setStatus] = useState<'present' | 'absent'>('present');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [lateReason, setLateReason] = useState('');
  const [earlyReason, setEarlyReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && row) {
      setStatus(row.status === 'absent' ? 'absent' : 'present');
      setClockIn(row.clockIn ?? '');
      setClockOut(row.clockOut ?? '');
      setAbsenceReason(row.absenceReason ?? '');
      setLateReason(row.lateReason ?? '');
      setEarlyReason(row.earlyLeaveReason ?? '');
      setError('');
    }
  }, [open, row]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!row) return;
    setError('');
    if (status === 'present') {
      const orderError = clockOrderError(clockIn, clockOut);
      if (orderError) {
        setError(orderError);
        return;
      }
    }
    try {
      await manual.mutateAsync({
        userId: row.userId,
        date,
        status,
        clockIn: status === 'present' && clockIn ? clockIn : undefined,
        clockOut: status === 'present' && clockOut ? clockOut : undefined,
        absenceReason: absenceReason || undefined,
        lateReason: lateReason || undefined,
        earlyLeaveReason: earlyReason || undefined,
      });
      toast.success('打刻を更新しました');
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>打刻の補正</DialogTitle>
          <DialogDescription>
            {row?.name} / {date}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* すでに補正されている場合は、誰がいつ直したかを見せる */}
          {row?.manualEditedAt && (
            <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-medium text-sky-800">
              この打刻は管理者が補正しています：
              {row.manualEditedByName ?? '職員'}（
              {formatDateTime(row.manualEditedAt)}）
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            保存すると「手修正」として記録され、遅刻・早退は補正後の時刻で判定し直されます。
          </p>

          <div className="space-y-1.5">
            <Label>状態</Label>
            <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
              {(
                [
                  ['present', '出席'],
                  ['absent', '欠席'],
                ] as const
              ).map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-[5px] px-4 py-1.5 text-sm font-medium transition-colors ${
                    status === s
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {status === 'present' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-in">通所時刻</Label>
                  <Input
                    id="m-in"
                    type="time"
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-out">退所時刻</Label>
                  <Input
                    id="m-out"
                    type="time"
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-late">遅刻理由（該当時）</Label>
                <Input
                  id="m-late"
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-early">早退理由（該当時）</Label>
                <Input
                  id="m-early"
                  value={earlyReason}
                  onChange={(e) => setEarlyReason(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="m-abs">欠席理由</Label>
              <Input
                id="m-abs"
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={manual.isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={manual.isPending}>
              {manual.isPending ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
