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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '../../lib/errors';
import {
  TAX_CATEGORY_LABELS,
  TAX_ROUNDING_LABELS,
  useCreateTaxSetting,
  useUpdateTaxSetting,
  type TaxCategory,
  type TaxRounding,
  type TaxSetting,
} from './taxApi';

export function TaxSettingFormDialog({
  open,
  onOpenChange,
  corporationId,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  corporationId: string;
  target?: TaxSetting | null;
}) {
  const isEdit = !!target;
  const create = useCreateTaxSetting();
  const update = useUpdateTaxSetting();

  const [effectiveDate, setEffectiveDate] = useState('');
  const [category, setCategory] = useState<TaxCategory>('reduced');
  const [rate, setRate] = useState('8');
  const [priceIncludesTax, setPriceIncludesTax] = useState(true);
  const [rounding, setRounding] = useState<TaxRounding>('floor');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setEffectiveDate(target?.effectiveDate ?? '');
      setCategory(target?.category ?? 'reduced');
      setRate(String(target?.rate ?? 8));
      setPriceIncludesTax(target?.priceIncludesTax ?? true);
      setRounding(target?.rounding ?? 'floor');
      setError('');
    }
  }, [open, target]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const data = {
      effectiveDate,
      category,
      rate: Number(rate) || 0,
      priceIncludesTax,
      rounding,
    };
    try {
      if (isEdit && target) {
        await update.mutateAsync({ corporationId, id: target.id, data });
        toast.success('消費税設定を更新しました');
      } else {
        await create.mutateAsync({ corporationId, data });
        toast.success('消費税設定を登録しました');
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
          <DialogTitle>{isEdit ? '消費税設定を編集' : '消費税設定を追加'}</DialogTitle>
          <DialogDescription>
            適用開始日からの消費税を区分ごとに設定します。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tx-date">適用開始日</Label>
            <Input
              id="tx-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>税区分</Label>
            <Select
              items={TAX_CATEGORY_LABELS}
              value={category}
              onValueChange={(v) => setCategory(v as TaxCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="区分を選択" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(TAX_CATEGORY_LABELS) as [TaxCategory, string][]
                ).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tx-rate">税率（％）</Label>
            <Input
              id="tx-rate"
              type="number"
              min={0}
              max={100}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
              className="max-w-28"
            />
          </div>

          <div className="space-y-1.5">
            <Label>税の扱い</Label>
            <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
              {(
                [
                  [true, '内税'],
                  [false, '外税'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPriceIncludesTax(v)}
                  className={`rounded-[5px] px-4 py-1.5 text-sm font-medium transition-colors ${
                    priceIncludesTax === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              内税＝料金に税を含む（料金から税を逆算）／外税＝料金に税を加算。
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>端数処理</Label>
            <Select
              items={TAX_ROUNDING_LABELS}
              value={rounding}
              onValueChange={(v) => setRounding(v as TaxRounding)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="端数処理を選択" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(TAX_ROUNDING_LABELS) as [TaxRounding, string][]
                ).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
