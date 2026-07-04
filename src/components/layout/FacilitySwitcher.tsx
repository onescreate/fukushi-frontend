import { Store } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_FACILITIES, useFacility } from '../../contexts/FacilityContext';

/** ヘッダーに置く店舗スイッチャー。全ページで共通の選択店舗を切り替える。 */
export function FacilitySwitcher() {
  const { facilityId, setFacilityId, facilities } = useFacility();
  if (facilities.length === 0) return null;

  // 複数店舗にアクセスできる人だけ「全店舗」を選べる
  const canPickAll = facilities.length > 1;
  const items: Record<string, string> = {
    ...(canPickAll ? { [ALL_FACILITIES]: '全店舗' } : {}),
    ...Object.fromEntries(facilities.map((f) => [f.id, f.name])),
  };

  return (
    <div className="flex items-center gap-1.5">
      <Store className="size-4 text-muted-foreground" />
      <Select
        items={items}
        value={facilityId || null}
        onValueChange={(v) => setFacilityId((v as string) ?? '')}
      >
        <SelectTrigger className="h-8 w-48 border-none bg-transparent shadow-none hover:bg-accent">
          <SelectValue placeholder="店舗を選択" />
        </SelectTrigger>
        <SelectContent>
          {canPickAll && (
            <SelectItem value={ALL_FACILITIES}>全店舗</SelectItem>
          )}
          {facilities.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
