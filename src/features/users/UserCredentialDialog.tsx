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
import { useResetUserPassword, useResetUserPin, type AppUser } from './api';

export function UserCredentialDialog({
  open,
  onOpenChange,
  user,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  mode: 'pin' | 'password';
}) {
  const resetPin = useResetUserPin();
  const resetPw = useResetUserPassword();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const isPin = mode === 'pin';
  const pending = resetPin.isPending || resetPw.isPending;

  useEffect(() => {
    if (open) {
      setValue('');
      setError('');
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    try {
      if (isPin) {
        await resetPin.mutateAsync({ id: user.id, pin: value });
        toast.success('PINを再設定しました');
      } else {
        await resetPw.mutateAsync({ id: user.id, password: value });
        toast.success('パスワードを再設定しました');
      }
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPin ? 'PIN再設定' : 'パスワード再設定'}</DialogTitle>
          <DialogDescription>
            {user ? `${user.lastName} ${user.firstName} さんの` : ''}
            {isPin
              ? 'タブレット用PINを再設定します。'
              : '自宅ログイン用パスワードを再設定します。'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cred">
              {isPin ? '新しいPIN（4〜6桁）' : '新しいパスワード（8文字以上）'}
            </Label>
            <Input
              id="cred"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              inputMode={isPin ? 'numeric' : undefined}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? '設定中…' : '再設定する'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
