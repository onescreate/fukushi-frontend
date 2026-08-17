import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface DetailRow {
  label: string;
  value: ReactNode;
}

/** データ行をクリックしたときに出す、共通の詳細モーダル（読み取り専用）。 */
export function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  rows,
  onEdit,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  rows: DetailRow[];
  onEdit?: () => void;
  /** 「閉じる」の右に置く任意のボタン群（承認/却下など）。 */
  actions?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <dl className="divide-y">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-3 gap-3 py-2.5 text-sm">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="col-span-2 break-words text-foreground">
                {r.value === '' || r.value == null ? '—' : r.value}
              </dd>
            </div>
          ))}
        </dl>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          {actions}
          {onEdit && <Button onClick={onEdit}>編集</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
