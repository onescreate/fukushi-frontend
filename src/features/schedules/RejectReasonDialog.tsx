import { useEffect, useState, type FormEvent } from 'react';
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

/** よく使う却下理由（ボタンで入力欄に入る）。 */
const PRESETS = [
  '定員に空きがありません',
  '時間の変更をお願いします',
  '事前にご相談ください',
  '内容を確認したいので職員までご連絡ください',
];

/**
 * 予定を却下するときの理由入力。
 * 理由は利用者の画面にそのまま表示されるため、空のままでも却下できる（任意）。
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  count,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 却下する件数（見出しに出す） */
  count: number;
  busy: boolean;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>却下の理由</DialogTitle>
          <DialogDescription>
            {count}件の予定を却下します。理由は利用者の画面にそのまま表示されます（任意）。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">理由</Label>
            <Input
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：この日は定員に空きがありません"
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? '処理中…' : '却下する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
