import { useMemo, useState } from 'react';
import { useMonthNav } from '@/hooks/useMonthNav';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFacility } from '../contexts/FacilityContext';
import { useMealDeliveries, useSetDelivery } from '../features/meals/deliveryApi';
import { formatDate, pad } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export default function MealDeliveryPage() {
  const { facilityId, singleFacilityId } = useFacility();
  const { year, month, changeMonth } = useMonthNav();

  const { data } = useMealDeliveries(facilityId, year, month);
  const setDelivery = useSetDelivery();

  const [editDate, setEditDate] = useState<string | null>(null);
  const [countInput, setCountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');


  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const openDay = (ds: string) => {
    if (!singleFacilityId) return; // 全店舗表示中は入力不可（店舗を選択して入力）
    const day = data?.days[ds];
    setEditDate(ds);
    setCountInput(
      day?.deliveryCount != null ? String(day.deliveryCount) : String(day?.orderCount ?? 0),
    );
    setNoteInput(day?.note ?? '');
  };

  const save = async () => {
    if (!editDate) return;
    try {
      await setDelivery.mutateAsync({
        facilityId,
        date: editDate,
        deliveryCount: Number(countInput) || 0,
        note: noteInput,
      });
      toast.success('納品数を保存しました');
      setEditDate(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const editDay = editDate ? data?.days[editDate] : undefined;

  const totals = useMemo(() => {
    const days = Object.values(data?.days ?? {});
    return {
      order: days.reduce((s, d) => s + d.orderCount, 0),
      delivery: days.reduce((s, d) => s + (d.deliveryCount ?? 0), 0),
    };
  }, [data]);

  return (
    <div>
      <PageHeader
        title="食事の注文・納品"
        description="日ごとの発注数（承認済みの予約食数。締切後のキャンセルも食事は届くため含みます）と実納品数を管理します。差分・未入力を確認できます。"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-24 text-center text-sm font-semibold">
            {year}年 {month}月
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        {facilityId && data && (
          <div className="ml-auto text-sm text-muted-foreground">
            発注計 <span className="font-semibold text-foreground">{totals.order}</span> 食 / 納品計{' '}
            <span className="font-semibold text-foreground">{totals.delivery}</span> 食
          </div>
        )}
      </div>

      {!singleFacilityId && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
          複数店舗の合計を表示しています（発注・納品の合算・閲覧のみ）。納品数を入力するにはヘッダーで店舗を1つ選択してください。
        </div>
      )}

      {facilityId && (
        <>
          <Card className="p-3">
            <div className="mb-1 grid grid-cols-7">
              {WEEK.map((w, i) => (
                <div
                  key={w}
                  className={`pb-2 text-center text-xs font-semibold ${
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
                const d = data?.days[ds];
                const orderCount = d?.orderCount ?? 0;
                const cancelledCount = d?.cancelledCount ?? 0;
                const hasOrder = orderCount > 0;
                const deliveryCount = d?.deliveryCount ?? null;
                const delivered = deliveryCount != null;
                const diff = delivered ? deliveryCount - orderCount : 0;
                const mismatch = delivered && diff !== 0;
                const unentered = hasOrder && !delivered;
                return (
                  <button
                    key={ds}
                    onClick={() => openDay(ds)}
                    className={`flex min-h-20 flex-col rounded-md border p-1.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 ${
                      mismatch
                        ? 'border-rose-300 bg-rose-50/50'
                        : unentered
                          ? 'border-amber-300 bg-amber-50/40'
                          : ''
                    }`}
                  >
                    <span className="text-xs font-medium text-slate-700">{day}</span>
                    {(hasOrder || delivered) && (
                      <div className="mt-1 space-y-0.5 text-[10px] leading-tight">
                        <div className="text-slate-500">
                          発注 {orderCount}
                          {cancelledCount > 0 && (
                            <span className="ml-1 text-rose-500">
                              (取{cancelledCount})
                            </span>
                          )}
                        </div>
                        <div className={delivered ? 'text-slate-700' : 'text-amber-600'}>
                          納品 {delivered ? deliveryCount : '未'}
                        </div>
                        {mismatch && (
                          <div className="font-bold text-rose-600">
                            差 {diff > 0 ? '+' : ''}
                            {diff}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 未入力・過不足の一覧 */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card className="p-4">
              <p className="mb-2 text-sm font-semibold text-amber-700">
                納品未入力（{data?.unentered.length ?? 0}日）
              </p>
              {(data?.unentered ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">未入力はありません。</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(data?.unentered ?? []).map((ds) => (
                    <button
                      key={ds}
                      onClick={() => openDay(ds)}
                      className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200"
                    >
                      {formatDate(ds)}（発注{data?.days[ds]?.orderCount}）
                    </button>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-4">
              <p className="mb-2 text-sm font-semibold text-rose-700">
                発注と納品の差異（{data?.mismatch.length ?? 0}日）
              </p>
              {(data?.mismatch ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">差異はありません。</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(data?.mismatch ?? []).map((m) => (
                    <button
                      key={m.date}
                      onClick={() => openDay(m.date)}
                      className="rounded-md bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-200"
                    >
                      {formatDate(m.date)}（発注{m.orderCount}/納品{m.deliveryCount}）
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* 納品入力ダイアログ */}
      <Dialog open={!!editDate} onOpenChange={(o) => !o && setEditDate(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>納品数の入力</DialogTitle>
            <DialogDescription>
              {editDate ? formatDate(editDate) : ''}・発注 {editDay?.orderCount ?? 0} 食
              {(editDay?.cancelledCount ?? 0) > 0 &&
                `（うちキャンセル ${editDay?.cancelledCount} 食。キャンセルでも食事は届くため発注数に含みます）`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dl-count">実納品数</Label>
              <Input
                id="dl-count"
                type="number"
                min={0}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                className="max-w-28"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dl-note">備考（任意）</Label>
              <Input
                id="dl-note"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="欠品・追加 など"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDate(null)} disabled={setDelivery.isPending}>
              キャンセル
            </Button>
            <Button onClick={save} disabled={setDelivery.isPending}>
              {setDelivery.isPending ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
