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
import { useResetStaffPassword, type Staff } from './api';

export function ResetPasswordDialog({
  open,
  onOpenChange,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
}) {
  const reset = useResetStaffPassword();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!staff) return;
    setError('');
    try {
      await reset.mutateAsync({ id: staff.id, password });
      toast.success('パスワードを再設定しました');
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>パスワード再設定</DialogTitle>
          <DialogDescription>
            {staff ? `${staff.lastName} ${staff.firstName} さんの新しいパスワードを設定します。` : ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="rp-pw">新しいパスワード（8文字以上）</Label>
            <Input
              id="rp-pw"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={reset.isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={reset.isPending}>
              {reset.isPending ? '設定中…' : '再設定する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
