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
  useCreateUser,
  useUpdateUser,
  useUsersFacilityOptions,
  type AppUser,
} from './api';

export function UserFormDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target?: AppUser | null;
}) {
  const isEdit = !!target;
  const { data: facilityOptions } = useUsersFacilityOptions(open);
  const create = useCreateUser();
  const update = useUpdateUser();

  const [loginId, setLoginId] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [kana, setKana] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [useSpecialMealFee, setUseSpecialMealFee] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [status, setStatus] = useState<'active' | 'withdrawn'>('active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setLoginId(target?.loginId ?? '');
      setLastName(target?.lastName ?? '');
      setFirstName(target?.firstName ?? '');
      setKana(target?.kana ?? '');
      setPin('');
      setPassword('');
      setFacilityId(target?.facilityId ?? '');
      setCertNumber(target?.certNumber ?? '');
      setUseSpecialMealFee(target?.useSpecialMealFee ?? false);
      setHeightCm(target?.heightCm ?? '');
      setStatus(target?.status ?? 'active');
      setError('');
    }
  }, [open, target]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const common = {
      lastName,
      firstName,
      kana: kana || undefined,
      facilityId,
      certNumber: certNumber || undefined,
      useSpecialMealFee,
      heightCm: heightCm ? Number(heightCm) : undefined,
      status,
    };
    try {
      if (isEdit && target) {
        await update.mutateAsync({ id: target.id, data: common });
        toast.success('利用者を更新しました');
      } else {
        await create.mutateAsync({ loginId, pin, password, ...common });
        toast.success('利用者を登録しました');
      }
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '利用者を編集' : '利用者を登録'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '利用者の情報を編集します。'
              : 'タブレット用PINと、自宅ログイン用アカウントを発行します。'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>所属店舗</Label>
            <Select
              items={Object.fromEntries(
                (facilityOptions ?? []).map((f) => [f.id, f.name]),
              )}
              value={facilityId || null}
              onValueChange={(v) => setFacilityId((v as string) ?? '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="店舗を選択" />
              </SelectTrigger>
              <SelectContent>
                {(facilityOptions ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-last">姓</Label>
              <Input
                id="u-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-first">名</Label>
              <Input
                id="u-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-kana">フリガナ（任意）</Label>
            <Input
              id="u-kana"
              value={kana}
              onChange={(e) => setKana(e.target.value)}
              placeholder="ケンショウ タロウ"
            />
          </div>

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="u-login">ログインID（自宅ログイン用）</Label>
                <Input
                  id="u-login"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="user001"
                />
                <p className="text-xs text-muted-foreground">
                  半角英数字・._- 。あとから変更できません。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="u-pin">PIN（4〜6桁・タブレット用）</Label>
                  <Input
                    id="u-pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    inputMode="numeric"
                    placeholder="1234"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-pw">自宅ログイン用パスワード</Label>
                  <Input
                    id="u-pw"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="off"
                    placeholder="8文字以上"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-cert">受給者証番号（任意）</Label>
              <Input
                id="u-cert"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-height">身長 cm（任意）</Label>
              <Input
                id="u-height"
                type="number"
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="170.5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>食事料金</Label>
            <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
              {(
                [
                  [false, '通常料金'],
                  [true, '特別料金'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setUseSpecialMealFee(v)}
                  className={`rounded-[5px] px-4 py-1.5 text-sm font-medium transition-colors ${
                    useSpecialMealFee === v
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {useSpecialMealFee
                ? '店舗の「特別食事料金」を適用します（金額は食事料金設定で管理）。'
                : '店舗の「通常食事料金」を適用します。補助がない等で特別料金の利用者のみ「特別料金」を選択してください。'}
            </p>
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label>ステータス</Label>
              <div className="inline-flex rounded-md border bg-muted/50 p-0.5">
                {(
                  [
                    ['active', '利用中'],
                    ['withdrawn', '退所'],
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
          )}

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
