import { pad } from '@/lib/format';
import { useMemo, useState } from 'react';
import { useMonthNav } from '@/hooks/useMonthNav';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMySchedules } from '../../features/schedules/myApi';
import { useMyMeals, useMySubmitMeal, type Meal } from '../../features/meals/reservationApi';
import { getApiErrorMessage } from '../../lib/errors';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

/** 日付セルに表示する食事の状態ラベル。 */
function mealBadge(meal: Meal | undefined) {
  if (!meal) return null;
  // キャンセル申請中は approvalStatus=approved のまま requestType=cancel で表す
  if (meal.requestType === 'cancel') {
    return { text: '取消申請中', cls: 'bg-amber-100 text-amber-700' };
  }
  if (meal.approvalStatus === 'pending') {
    return { text: '予約申請中', cls: 'bg-amber-100 text-amber-700' };
  }
  if (meal.status === 'reserved') return { text: '予約済', cls: 'bg-orange-100 text-orange-700' };
  if (meal.status === 'eaten') return { text: '喫食済', cls: 'bg-orange-100 text-orange-700' };
  if (meal.status === 'cancelled') return { text: 'キャンセル', cls: 'bg-slate-100 text-slate-500' };
  if (meal.status === 'revoked') return { text: '取消', cls: 'bg-slate-100 text-slate-500' };
  if (meal.approvalStatus === 'rejected') return { text: '却下', cls: 'bg-slate-100 text-slate-500' };
  return null;
}

export default function PersonalMealPage() {
  const nav = useMonthNav();
  const { year, month } = nav;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;

  const { data: schedules } = useMySchedules(from, to);
  const { data: meals } = useMyMeals(from, to);
  const submit = useMySubmitMeal();

  // 承認済みの通所予定がある日のみ予約できる
  const scheduledDays = useMemo(() => {
    const s = new Set<string>();
    (schedules ?? []).forEach((sc) => {
      if (sc.status === 'approved') s.add(sc.planDate.slice(0, 10));
    });
    return s;
  }, [schedules]);

  const mealByDate = useMemo(() => {
    const map = new Map<string, Meal>();
    (meals ?? []).forEach((m) => map.set(m.mealDate, m));
    return map;
  }, [meals]);

  const changeMonth = (delta: number) => {
    nav.changeMonth(delta);
    setSelected(new Set());
  };

  const toggle = (ds: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ds)) next.delete(ds);
      else next.add(ds);
      return next;
    });
  };

  const handleSubmit = async (action: 'reserve' | 'cancel') => {
    const dates = [...selected];
    if (dates.length === 0) return;
    try {
      const r = await submit.mutateAsync({ dates, action });
      const parts: string[] = [];
      if (r.reserved) parts.push(`予約 ${r.reserved}件`);
      if (r.pendingReserve) parts.push(`予約申請 ${r.pendingReserve}件`);
      if (r.revoked) parts.push(`取消 ${r.revoked}件`);
      if (r.pendingCancel) parts.push(`取消申請 ${r.pendingCancel}件`);
      toast.success(parts.length ? parts.join('、') + ' を受け付けました' : '処理しました');
      if (r.skipped.length) {
        toast.warning(
          r.skipped.map((s) => `${s.date}: ${s.reason}`).join(' / '),
        );
      }
      setSelected(new Set());
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="w-28 text-center text-base font-bold text-slate-800">
          {year}年 {month}月
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Card className="p-2 sm:p-3">
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
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e${idx}`} />;
            const ds = `${year}-${pad(month)}-${pad(day)}`;
            const selectable = scheduledDays.has(ds);
            const meal = mealByDate.get(ds);
            const badge = mealBadge(meal);
            const isSel = selected.has(ds);
            return (
              <button
                key={ds}
                disabled={!selectable}
                onClick={() => toggle(ds)}
                className={`flex min-h-14 flex-col rounded-lg border p-1 text-left transition-colors sm:min-h-16 sm:p-1.5 ${
                  !selectable
                    ? 'cursor-not-allowed border-transparent bg-slate-50 text-slate-300'
                    : isSel
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                      : 'border-slate-200 active:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold">{day}</span>
                {badge && (
                  <span
                    className={`mt-0.5 rounded px-1 py-0.5 text-center text-[9px] font-bold leading-tight sm:text-[10px] ${badge.cls}`}
                  >
                    {badge.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400">
        通所予定がある日だけ選べます。締切後や直前の取消は承認・キャンセル料が発生する場合があります。
      </p>

      {/* 予約/取消バー（画面下に固定） */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="text-sm font-bold text-slate-600">選択 {selected.size}日</span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit('cancel')}
              disabled={selected.size === 0 || submit.isPending}
              className="h-12 px-6"
            >
              取消
            </Button>
            <Button
              onClick={() => handleSubmit('reserve')}
              disabled={selected.size === 0 || submit.isPending}
              className="h-12 px-8"
            >
              予約
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
