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
  useCreateMealPricing,
  useUpdateMealPricing,
  type MealPricing,
} from './api';

export function MealPricingFormDialog({
  open,
  onOpenChange,
  facilityId,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  target?: MealPricing | null;
}) {
  const isEdit = !!target;
  const create = useCreateMealPricing();
  const update = useUpdateMealPricing();

  const [effectiveDate, setEffectiveDate] = useState('');
  const [mealFee, setMealFee] = useState('0');
  const [cancelFee, setCancelFee] = useState('0');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setEffectiveDate(target?.effectiveDate ?? '');
      setMealFee(String(target?.mealFee ?? 0));
      setCancelFee(String(target?.cancelFee ?? 0));
      setError('');
    }
  }, [open, target]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const data = {
      effectiveDate,
      mealFee: Number(mealFee) || 0,
      cancelFee: Number(cancelFee) || 0,
    };
    try {
      if (isEdit && target) {
        await update.mutateAsync({ facilityId, id: target.id, data });
        toast.success('食事料金を更新しました');
      } else {
        await create.mutateAsync({ facilityId, data });
        toast.success('食事料金を登録しました');
      }
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? '食事料金を編集' : '食事料金を追加'}</DialogTitle>
          <DialogDescription>
            適用開始日からの料金を設定します。金額は消費税込み（内税）で入力してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="mp-date">適用開始日</Label>
            <Input
              id="mp-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              この日以降の食事にこの料金を適用します。
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mp-meal">食事料金（円・税込）</Label>
            <Input
              id="mp-meal"
              type="number"
              min={0}
              value={mealFee}
              onChange={(e) => setMealFee(e.target.value)}
              required
              className="max-w-40"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mp-cancel">キャンセル料（円・税込）</Label>
            <Input
              id="mp-cancel"
              type="number"
              min={0}
              value={cancelFee}
              onChange={(e) => setCancelFee(e.target.value)}
              required
              className="max-w-40"
            />
            <p className="text-xs text-muted-foreground">
              利用日の直前キャンセルに課金する金額です。
            </p>
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
