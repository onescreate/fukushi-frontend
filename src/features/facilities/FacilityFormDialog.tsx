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
  AddressContactFields,
  addressContactFromEntity,
  addressContactToInput,
  emptyAddressContact,
  type AddressContactValue,
} from '../../components/form/AddressContactFields';
import { hasPermission, useMe } from '../auth/useMe';
import { useCorporations } from '../corporations/api';
import {
  SERVICE_TYPE_LABELS,
  useCreateFacility,
  useUpdateFacility,
  type Facility,
  type ServiceType,
} from './api';

export function FacilityFormDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target?: Facility | null;
}) {
  const isEdit = !!target;
  const { data: me } = useMe();
  const canChooseCorp = hasPermission(me, 'corporation.manage');
  const { data: corporations } = useCorporations(canChooseCorp && open);

  const create = useCreateFacility();
  const update = useUpdateFacility();

  const [corporationId, setCorporationId] = useState('');
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('continuous_b');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [address, setAddress] = useState<AddressContactValue>(emptyAddressContact);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCorporationId(target?.corporationId ?? me?.corporationId ?? '');
      setName(target?.name ?? '');
      setServiceType(target?.serviceType ?? 'continuous_b');
      setEmail(target?.email ?? '');
      setStatus(target?.status ?? 'active');
      setAddress(addressContactFromEntity(target));
      setError('');
    }
  }, [open, target, me?.corporationId]);

  const patchAddress = (patch: Partial<AddressContactValue>) =>
    setAddress((prev) => ({ ...prev, ...patch }));

  const submitting = create.isPending || update.isPending;

  const corpItems: Record<string, string> = Object.fromEntries(
    (corporations ?? []).map((c) => [c.id, c.name]),
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const common = {
        name,
        serviceType,
        email: email || undefined,
        status,
        ...addressContactToInput(address),
      };
      if (isEdit && target) {
        await update.mutateAsync({ id: target.id, data: common });
        toast.success('店舗を更新しました');
      } else {
        await create.mutateAsync({ corporationId, ...common });
        toast.success('店舗を登録しました');
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
          <DialogTitle>{isEdit ? '店舗を編集' : '店舗を登録'}</DialogTitle>
          <DialogDescription>店舗（施設）の情報を入力してください。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 法人（システム管理者のみ選択可。編集時は変更不可） */}
          {canChooseCorp && !isEdit && (
            <div className="space-y-1.5">
              <Label>法人</Label>
              <Select
                items={corpItems}
                value={corporationId || null}
                onValueChange={(v) => setCorporationId((v as string) ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="法人を選択" />
                </SelectTrigger>
                <SelectContent>
                  {(corporations ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fac-name">店舗名</Label>
            <Input
              id="fac-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="〇〇事業所"
            />
          </div>

          <div className="space-y-1.5">
            <Label>サービス種別</Label>
            <Select
              items={SERVICE_TYPE_LABELS}
              value={serviceType}
              onValueChange={(v) => setServiceType(v as ServiceType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="種別を選択" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]
                ).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fac-email">連絡先メール（任意）</Label>
            <Input
              id="fac-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="facility@example.com"
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

          <AddressContactFields value={address} onChange={patchAddress} />

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
