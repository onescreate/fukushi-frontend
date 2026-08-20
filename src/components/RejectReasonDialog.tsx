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

/** 予定承認でよく使う却下理由。 */
export const SCHEDULE_REJECT_PRESETS = [
  '定員に空きがありません',
  '時間の変更をお願いします',
  '事前にご相談ください',
  '内容を確認したいので職員までご連絡ください',
];

/** 食事承認でよく使う却下理由。 */
export const MEAL_REJECT_PRESETS = [
  '食事の申込み締切を過ぎています',
  'この日は食事の提供がありません',
  '通所予定を先に申請してください',
  '内容を確認したいので職員までご連絡ください',
];

/**
 * 申請を却下するときの理由入力（予定承認・食事承認で共通）。
 * 理由は利用者の画面にそのまま表示されるため、空のままでも却下できる（任意）。
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  count,
  busy,
  onSubmit,
  targetLabel = '予定',
  presets = SCHEDULE_REJECT_PRESETS,
  placeholder = '例：この日は定員に空きがありません',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 却下する件数（見出しに出す） */
  count: number;
  busy: boolean;
  onSubmit: (reason: string) => void;
  /** 「〇〇を却下します」の〇〇（例: 予定 / 食事の申請） */
  targetLabel?: string;
  /** よく使う理由のボタン */
  presets?: string[];
  placeholder?: string;
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
            {count}件の{targetLabel}を却下します。理由は利用者の画面にそのまま表示されます（任意）。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">理由</Label>
            <Input
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
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
