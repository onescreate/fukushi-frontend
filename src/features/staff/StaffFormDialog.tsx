import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
import { hasPermission, useMe } from '../auth/useMe';
import { useCorporations } from '../corporations/api';
import {
  FACILITY_SCOPED_ROLES,
  ROLE_LABELS,
  useCreateStaff,
  useStaffFacilityOptions,
  useUpdateStaff,
  type Staff,
  type StaffRole,
} from './api';
import type { Me } from '../../types/me';

function allowedRoles(me: Me | undefined): StaffRole[] {
  const roles = me?.roles?.map((r) => r.role) ?? [];
  if (roles.includes('system_admin'))
    return ['system_admin', 'corporation_admin', 'facility_admin', 'staff'];
  if (roles.includes('corporation_admin'))
    return ['corporation_admin', 'facility_admin', 'staff'];
  return ['staff'];
}

export function StaffFormDialog({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target?: Staff | null;
}) {
  const isEdit = !!target;
  const { data: me } = useMe();
  const canChooseCorp = hasPermission(me, 'corporation.manage');
  const { data: corporations } = useCorporations(canChooseCorp && open);
  const { data: facilityOptions } = useStaffFacilityOptions(open);

  const create = useCreateStaff();
  const update = useUpdateStaff();

  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [corporationId, setCorporationId] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [facilityId, setFacilityId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const current = target?.facilityRoles?.[0];
      setLastName(target?.lastName ?? '');
      setFirstName(target?.firstName ?? '');
      setEmail(target?.email ?? '');
      setPassword('');
      setCorporationId(target?.corporationId ?? me?.corporationId ?? '');
      setRole((current?.role as StaffRole) ?? 'staff');
      setFacilityId(current?.facilityId ?? '');
      setStatus(target?.status ?? 'active');
      setError('');
    }
  }, [open, target, me?.corporationId]);

  const roleOptions = allowedRoles(me);
  const needsFacility = FACILITY_SCOPED_ROLES.includes(role);

  const facilitiesForCorp = useMemo(
    () => (facilityOptions ?? []).filter((f) => f.corporationId === corporationId),
    [facilityOptions, corporationId],
  );

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit && target) {
        await update.mutateAsync({
          id: target.id,
          data: {
            lastName,
            firstName,
            status,
            role,
            facilityId: needsFacility ? facilityId : undefined,
          },
        });
        toast.success('職員を更新しました');
      } else {
        await create.mutateAsync({
          lastName,
          firstName,
          email,
          password,
          corporationId,
          role,
          facilityId: needsFacility ? facilityId : undefined,
        });
        toast.success('職員を登録しました');
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
          <DialogTitle>{isEdit ? '職員を編集' : '職員を登録'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '職員の情報と権限を編集します。'
              : 'ログインアカウントを発行します。初期パスワードを本人に伝えてください。'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {canChooseCorp && !isEdit && (
            <div className="space-y-1.5">
              <Label>法人</Label>
              <Select
                items={Object.fromEntries(
                  (corporations ?? []).map((c) => [c.id, c.name]),
                )}
                value={corporationId || null}
                onValueChange={(v) => {
                  setCorporationId((v as string) ?? '');
                  setFacilityId('');
                }}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-last">姓</Label>
              <Input
                id="st-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-first">名</Label>
              <Input
                id="st-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
          </div>

          {isEdit ? (
            <div className="space-y-1.5">
              <Label>メールアドレス</Label>
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {email}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="st-email">メールアドレス（ログインID）</Label>
                <Input
                  id="st-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="st-pw">初期パスワード（8文字以上）</Label>
                <Input
                  id="st-pw"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="off"
                  placeholder="本人に伝えるパスワード"
                />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>権限</Label>
            <Select
              items={Object.fromEntries(
                roleOptions.map((r) => [r, ROLE_LABELS[r]]),
              )}
              value={role}
              onValueChange={(v) => {
                setRole(v as StaffRole);
                if (!FACILITY_SCOPED_ROLES.includes(v as StaffRole))
                  setFacilityId('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="権限を選択" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsFacility && (
            <div className="space-y-1.5">
              <Label>所属店舗</Label>
              <Select
                items={Object.fromEntries(
                  facilitiesForCorp.map((f) => [f.id, f.name]),
                )}
                value={facilityId || null}
                onValueChange={(v) => setFacilityId((v as string) ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="店舗を選択" />
                </SelectTrigger>
                <SelectContent>
                  {facilitiesForCorp.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isEdit && (
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
