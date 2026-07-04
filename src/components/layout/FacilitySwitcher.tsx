import { Store } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFacility } from '../../contexts/FacilityContext';

/** ヘッダーに置く店舗スイッチャー。全ページで共通の選択店舗を切り替える。 */
export function FacilitySwitcher() {
  const { facilityId, setFacilityId, facilities } = useFacility();
  if (facilities.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Store className="size-4 text-muted-foreground" />
      <Select
        items={Object.fromEntries(facilities.map((f) => [f.id, f.name]))}
        value={facilityId || null}
        onValueChange={(v) => setFacilityId((v as string) ?? '')}
      >
        <SelectTrigger className="h-8 w-48 border-none bg-transparent shadow-none hover:bg-accent">
          <SelectValue placeholder="店舗を選択" />
        </SelectTrigger>
        <SelectContent>
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
