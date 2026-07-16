import { pad, yen } from '@/lib/format';
import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBillingDetail, type BillingDetailItem } from './billingApi';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

function dayStyle(item: BillingDetailItem | undefined) {
  if (!item) return { cls: '', label: '' };
  if (item.status === 'eaten') return { cls: 'bg-orange-100 text-orange-700', label: '喫食' };
  if (item.status === 'reserved') return { cls: 'bg-slate-100 text-slate-600', label: '予約' };
  return { cls: 'bg-rose-100 text-rose-700', label: 'キャンセル' };
}

export function BillingDetailDialog({
  open,
  onOpenChange,
  userId,
  userName,
  year,
  month,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
  year: number;
  month: number;
}) {
  const { data, isLoading } = useBillingDetail(open ? userId : null, year, month);

  const byDate = useMemo(() => {
    const m = new Map<string, BillingDetailItem>();
    (data ?? []).forEach((d) => m.set(d.mealDate, d));
    return m;
  }, [data]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{userName} さんの食事明細</DialogTitle>
          <DialogDescription>
            {year}年{month}月・喫食＝橙／予約＝灰／キャンセル＝赤
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">読み込み中…</div>
        ) : (
          <>
            <div className="grid grid-cols-7">
              {WEEK.map((w, i) => (
                <div
                  key={w}
                  className={`pb-1 text-center text-xs font-semibold ${
                    i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e${idx}`} />;
                const ds = `${year}-${pad(month)}-${pad(day)}`;
                const item = byDate.get(ds);
                const st = dayStyle(item);
                return (
                  <div
                    key={ds}
                    className="flex min-h-14 flex-col rounded-md border p-1 text-left"
                  >
                    <span className="text-[11px] font-medium text-slate-600">{day}</span>
                    {item && (
                      <span className={`mt-0.5 rounded px-1 py-0.5 text-[10px] font-medium ${st.cls}`}>
                        {st.label}
                      </span>
                    )}
                    {item && (
                      <span className="mt-auto text-[10px] tabular-nums text-muted-foreground">
                        {yen(item.amount)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {(data ?? []).length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                この月の食事はありません。
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
