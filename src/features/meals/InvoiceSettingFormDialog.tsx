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
  useCreateInvoiceSetting,
  useUpdateInvoiceSetting,
  type InvoiceSetting,
} from './invoiceApi';

const textareaCls =
  'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export function InvoiceSettingFormDialog({
  open,
  onOpenChange,
  facilityId,
  target,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  target?: InvoiceSetting | null;
}) {
  const isEdit = !!target;
  const create = useCreateInvoiceSetting();
  const update = useUpdateInvoiceSetting();

  const [effectiveDate, setEffectiveDate] = useState('');
  const [issuerName, setIssuerName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setEffectiveDate(target?.effectiveDate ?? '');
      setIssuerName(target?.issuerName ?? '');
      setRegistrationNumber(target?.registrationNumber ?? '');
      setPostalCode(target?.postalCode ?? '');
      setAddress(target?.address ?? '');
      setPhone(target?.phone ?? '');
      setBankInfo(target?.bankInfo ?? '');
      setError('');
    }
  }, [open, target]);

  const submitting = create.isPending || update.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const data = {
      effectiveDate,
      issuerName,
      registrationNumber: registrationNumber || undefined,
      postalCode: postalCode || undefined,
      address: address || undefined,
      phone: phone || undefined,
      bankInfo: bankInfo || undefined,
    };
    try {
      if (isEdit && target) {
        await update.mutateAsync({ facilityId, id: target.id, data });
        toast.success('発行者情報を更新しました');
      } else {
        await create.mutateAsync({ facilityId, data });
        toast.success('発行者情報を登録しました');
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
          <DialogTitle>{isEdit ? '発行者情報を編集' : '発行者情報を登録'}</DialogTitle>
          <DialogDescription>
            適格請求書に印字する発行者情報を設定します（適用開始日つき）。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="iv-date">適用開始日</Label>
            <Input
              id="iv-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="iv-name">発行者名（事業者名）</Label>
            <Input
              id="iv-name"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
              required
              placeholder="〇〇株式会社 / 〇〇事業所"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="iv-reg">登録番号（適格請求書発行事業者）</Label>
            <Input
              id="iv-reg"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="T1234567890123"
            />
          </div>

          <div className="flex gap-3">
            <div className="w-32 space-y-1.5">
              <Label htmlFor="iv-postal">郵便番号</Label>
              <Input
                id="iv-postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="000-0000"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="iv-phone">電話番号</Label>
              <Input
                id="iv-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03-0000-0000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="iv-addr">住所</Label>
            <Input
              id="iv-addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="東京都〇〇区…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="iv-bank">振込先</Label>
            <textarea
              id="iv-bank"
              value={bankInfo}
              onChange={(e) => setBankInfo(e.target.value)}
              rows={3}
              className={textareaCls}
              placeholder={'〇〇銀行 〇〇支店\n普通 1234567\n口座名義 …'}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
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
