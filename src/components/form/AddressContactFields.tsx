import { useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage } from '../../lib/errors';
import { lookupPostal } from '../../lib/postal';

export interface AddressContactValue {
  establishedOn: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  phone: string;
}

export const emptyAddressContact: AddressContactValue = {
  establishedOn: '',
  postalCode: '',
  prefecture: '',
  city: '',
  addressLine: '',
  phone: '',
};

interface AddressContactEntity {
  establishedOn?: string | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  addressLine?: string | null;
  phone?: string | null;
}

/** 既存レコード → フォーム値（日付はYYYY-MM-DDへ） */
export function addressContactFromEntity(
  e?: AddressContactEntity | null,
): AddressContactValue {
  return {
    establishedOn: e?.establishedOn ? e.establishedOn.slice(0, 10) : '',
    postalCode: e?.postalCode ?? '',
    prefecture: e?.prefecture ?? '',
    city: e?.city ?? '',
    addressLine: e?.addressLine ?? '',
    phone: e?.phone ?? '',
  };
}

/** フォーム値 → API入力（空文字は送らない） */
export function addressContactToInput(v: AddressContactValue) {
  return {
    establishedOn: v.establishedOn || undefined,
    postalCode: v.postalCode || undefined,
    prefecture: v.prefecture || undefined,
    city: v.city || undefined,
    addressLine: v.addressLine || undefined,
    phone: v.phone || undefined,
  };
}

export function AddressContactFields({
  value,
  onChange,
}: {
  value: AddressContactValue;
  onChange: (patch: Partial<AddressContactValue>) => void;
}) {
  const [looking, setLooking] = useState(false);

  const doLookup = async (code: string) => {
    setLooking(true);
    try {
      const r = await lookupPostal(code);
      onChange({
        prefecture: r.prefecture,
        city: r.city,
        // 町名がまだ空なら自動補完（既に入力済みなら上書きしない）
        addressLine: value.addressLine || r.town,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, '住所が見つかりませんでした'));
    } finally {
      setLooking(false);
    }
  };

  const onPostalChange = (raw: string) => {
    onChange({ postalCode: raw });
    if (raw.replace(/[^0-9]/g, '').length === 7) {
      void doLookup(raw);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ac-established">設立年月日</Label>
        <Input
          id="ac-established"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={value.establishedOn}
          onChange={(e) => onChange({ establishedOn: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ac-postal">郵便番号</Label>
        <div className="flex gap-2">
          <Input
            id="ac-postal"
            value={value.postalCode}
            onChange={(e) => onPostalChange(e.target.value)}
            placeholder="1000001"
            inputMode="numeric"
            className="max-w-40"
          />
          <Button
            type="button"
            variant="outline"
            disabled={looking}
            onClick={() => value.postalCode && doLookup(value.postalCode)}
          >
            <Search className="size-4" />
            住所検索
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          7桁を入力すると自動で住所が入ります。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ac-pref">都道府県</Label>
          <Input
            id="ac-pref"
            value={value.prefecture}
            onChange={(e) => onChange({ prefecture: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ac-city">市区町村</Label>
          <Input
            id="ac-city"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ac-addr">町名・番地・建物名</Label>
        <Input
          id="ac-addr"
          value={value.addressLine}
          onChange={(e) => onChange({ addressLine: e.target.value })}
          placeholder="千代田1-1 〇〇ビル3F"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ac-phone">電話番号</Label>
        <Input
          id="ac-phone"
          value={value.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="03-1234-5678"
          inputMode="tel"
        />
      </div>
    </div>
  );
}
