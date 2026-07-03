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
  MEAL_STATUS_LABELS,
  useAdminMealUpsert,
  type Meal,
  type MealStatus,
} from './reservationApi';

interface UserOption {
  id: string;
  name: string;
}

export function MealAdminDialog({
  open,
  onOpenChange,
  users,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserOption[];
  target?: (Meal & { userName?: string }) | null;
}) {
  const isEdit = !!target;
  const upsert = useAdminMealUpsert();

  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<MealStatus>('reserved');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUserId(target?.userId ?? '');
      setDate(target?.mealDate ?? '');
      setStatus(target?.status ?? 'reserved');
      setError('');
    }
  }, [open, target]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await upsert.mutateAsync({ userId, date, status });
      toast.success(isEdit ? '食事を更新しました' : '食事を登録しました');
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? '食事を編集' : '食事を登録'}</DialogTitle>
          <DialogDescription>
            管理側の操作は締切・承認を経ずに即時反映されます（通所予定がある日のみ予約可）。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>利用者</Label>
            <Select
              items={Object.fromEntries(users.map((u) => [u.id, u.name]))}
              value={userId || null}
              onValueChange={(v) => setUserId((v as string) ?? '')}
            >
              <SelectTrigger className="w-full" disabled={isEdit}>
                <SelectValue placeholder="利用者を選択" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ma-date">利用日</Label>
            <Input
              id="ma-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label>状態</Label>
            <Select
              items={MEAL_STATUS_LABELS}
              value={status}
              onValueChange={(v) => setStatus(v as MealStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="状態を選択" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(MEAL_STATUS_LABELS) as [MealStatus, string][]).map(
                  ([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              予約/喫食済＝食事料金、キャンセル＝キャンセル料、取消＝無料。
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={upsert.isPending}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
