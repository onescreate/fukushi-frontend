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
  useCreateCorporation,
  useUpdateCorporation,
  type Corporation,
} from './api';

export function CorporationFormDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target?: Corporation | null;
}) {
  const isEdit = !!target;
  const create = useCreateCorporation();
  const update = useUpdateCorporation();

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(target?.name ?? '');
      setStatus(target?.status ?? 'active');
      setError('');
    }
  }, [open, target]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit && target) {
        await update.mutateAsync({ id: target.id, data: { name, status } });
        toast.success('法人を更新しました');
      } else {
        await create.mutateAsync({ name, status });
        toast.success('法人を登録しました');
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
          <DialogTitle>{isEdit ? '法人を編集' : '法人を登録'}</DialogTitle>
          <DialogDescription>法人の基本情報を入力してください。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="corp-name">法人名</Label>
            <Input
              id="corp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="〇〇福祉会"
            />
          </div>

          <div className="space-y-1.5">
            <Label>ステータス</Label>
            <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
              {(['active', 'inactive'] as const).map((s) => (
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
                  {s === 'active' ? '有効' : '無効'}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
