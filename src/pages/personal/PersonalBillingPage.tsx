import { Card } from '@/components/ui/card';
import { Receipt } from 'lucide-react';
import { useMyBilling } from '../../features/billing/myApi';
import { yen } from '../../lib/format';

export default function PersonalBillingPage() {
  const { data, isLoading } = useMyBilling();

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-slate-400">読み込み中…</p>;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <Receipt className="size-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">請求書はまだありません</p>
        <p className="text-xs text-slate-400">
          月締めが完了すると、食事代の請求書がここに表示されます。
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((r) => (
        <Card key={`${r.year}-${r.month}`} className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-black text-slate-800">
              {r.year}年 {r.month}月分
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                r.paid
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {r.paid ? '入金済' : '未入金'}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>食事代（{r.mealCount}食）</span>
              <span className="tabular-nums">{yen(r.mealTotal)}</span>
            </div>
            {r.cancelCount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>キャンセル料（{r.cancelCount}件）</span>
                <span className="tabular-nums">{yen(r.cancelTotal)}</span>
              </div>
            )}
            {r.taxAmount > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>
                  内 消費税
                  {r.taxRate != null ? `（${Math.round(r.taxRate * 100)}%）` : ''}
                </span>
                <span className="tabular-nums">{yen(r.taxAmount)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm font-bold text-slate-600">請求合計</span>
            <span className="text-xl font-black tabular-nums text-slate-900">
              {yen(r.total)}
            </span>
          </div>

          {r.paid && r.paymentDate && (
            <p className="mt-2 text-right text-[11px] text-slate-400">
              入金日：{r.paymentDate}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
