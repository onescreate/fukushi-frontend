import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '../../lib/errors';
import { useSubmitReason, type ReasonKind } from '../../features/schedules/myApi';

const KIND_LABEL: Record<ReasonKind, string> = {
  absence: '欠席',
  late: '遅刻',
  early: '早退',
};

export function PersonalReasonDialog({
  open,
  onOpenChange,
  date,
  kind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  kind: ReasonKind;
}) {
  const submit = useSubmitReason();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    try {
      await submit.mutateAsync({ date, kind, reason: reason.trim() });
      toast.success('理由を送信しました');
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[26rem]">
        <DialogHeader>
          <DialogTitle>
            {date} の{KIND_LABEL[kind]}理由
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
            placeholder="理由を入力してください"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 outline-none focus:border-indigo-400"
          />
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
            <Button
              type="submit"
              disabled={submit.isPending || !reason.trim()}
              className="h-12 flex-1"
            >
              {submit.isPending ? '送信中…' : '送信'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
