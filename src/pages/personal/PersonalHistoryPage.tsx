import { useMemo } from 'react';
import { pad } from '@/lib/format';
import { useMonthNav } from '@/hooks/useMonthNav';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMyAttendance, type MyAttendanceRecord } from '../../features/attendance/myApi';
import { useMySchedules } from '../../features/schedules/myApi';
import { useMyMeals, type Meal } from '../../features/meals/reservationApi';
import type { Schedule } from '../../features/schedules/api';
import { getHolidayName } from '../../lib/holidays';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

interface DayRow {
  date: string; // YYYY-MM-DD
  sch?: Schedule;
  att?: MyAttendanceRecord;
  meal?: Meal;
}

/** 食事の状態ラベル。 */
function mealInfo(meal: Meal | undefined): { text: string; cls: string } | null {
  if (!meal) return null;
  if (meal.requestType === 'cancel')
    return { text: '取消申請中', cls: 'bg-amber-100 text-amber-700' };
  if (meal.approvalStatus === 'pending')
    return { text: '予約申請中', cls: 'bg-amber-100 text-amber-700' };
  // 却下された予約は status が 'reserved' のまま残るため、status より先に判定する
  // （順序が逆だと「予約済」と表示されてしまう）。
  if (meal.approvalStatus === 'rejected')
    return { text: '却下', cls: 'bg-rose-100 text-rose-600' };
  if (meal.status === 'reserved') return { text: '予約済', cls: 'bg-orange-100 text-orange-700' };
  if (meal.status === 'eaten') return { text: '喫食済', cls: 'bg-orange-100 text-orange-700' };
  if (meal.status === 'cancelled')
    return { text: 'キャンセル', cls: 'bg-slate-100 text-slate-500' };
  if (meal.status === 'revoked') return { text: '取消', cls: 'bg-slate-100 text-slate-500' };
  return null;
}

/** 予定の状態バッジ。 */
function planBadge(sch: Schedule): { text: string; cls: string } {
  const isPractice = (sch.details ?? []).some((d) => d.eventType === 'practice');
  if (sch.status === 'pending') return { text: '申請中', cls: 'bg-amber-100 text-amber-700' };
  if (sch.status === 'rejected') return { text: '却下', cls: 'bg-rose-100 text-rose-600' };
  return isPractice
    ? { text: '実習', cls: 'bg-violet-100 text-violet-700' }
    : { text: '通所', cls: 'bg-emerald-100 text-emerald-700' };
}

/** 左ラベル付きの1行。 */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="w-10 shrink-0 pt-0.5 text-[11px] font-bold text-slate-400">
        {label}
      </span>
      <div className="flex-1 space-y-1 text-sm text-slate-700">{children}</div>
    </div>
  );
}

export default function PersonalHistoryPage() {
  const { year, month, changeMonth } = useMonthNav();

  const daysInMonth = new Date(year, month, 0).getDate();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const { data: attendance, isLoading } = useMyAttendance(from, to);
  const { data: schedules } = useMySchedules(from, to);
  const { data: meals } = useMyMeals(from, to);

  // 予定・打刻・食事を日付ごとに合流
  const days = useMemo<DayRow[]>(() => {
    const map = new Map<string, DayRow>();
    const get = (ds: string) => {
      let e = map.get(ds);
      if (!e) {
        e = { date: ds };
        map.set(ds, e);
      }
      return e;
    };
    (schedules ?? []).forEach((s) => (get(s.planDate.slice(0, 10)).sch = s));
    (attendance ?? []).forEach((a) => (get(a.date.slice(0, 10)).att = a));
    (meals ?? []).forEach((m) => (get(m.mealDate.slice(0, 10)).meal = m));
    return [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [schedules, attendance, meals]);

  // 月のサマリー
  const summary = useMemo(() => {
    let present = 0,
      absent = 0,
      late = 0,
      early = 0,
      meal = 0;
    days.forEach((d) => {
      if (d.att?.status === 'absent') absent++;
      else if (d.att?.status === 'present') present++;
      if (d.att?.isLate) late++;
      if (d.att?.isEarlyLeave) early++;
      if (d.meal && (d.meal.status === 'reserved' || d.meal.status === 'eaten')) meal++;
    });
    return { present, absent, late, early, meal };
  }, [days]);

  return (
    <div className="space-y-4">
      {/* 月移動 */}
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

      {/* サマリー */}
      <Card className="grid grid-cols-4 divide-x divide-slate-100 p-0 sm:grid-cols-5">
        {[
          { label: '出席', value: summary.present, cls: 'text-emerald-600' },
          { label: '欠席', value: summary.absent, cls: 'text-rose-500' },
          { label: '遅刻', value: summary.late, cls: 'text-amber-600' },
          { label: '早退', value: summary.early, cls: 'text-amber-600' },
          { label: '食事', value: summary.meal, cls: 'text-orange-600' },
        ].map((s) => (
          <div
            key={s.label}
            className={`px-1 py-3 text-center ${s.label === '食事' ? 'col-span-4 border-t border-slate-100 sm:col-span-1 sm:border-t-0' : ''}`}
          >
            <div className={`text-xl font-black ${s.cls}`}>{s.value}</div>
            <div className="text-[11px] font-bold text-slate-400">{s.label}</div>
          </div>
        ))}
      </Card>

      {/* 日別カード */}
      {isLoading && (
        <Card className="p-10 text-center text-sm text-slate-400">読み込み中…</Card>
      )}
      {!isLoading && days.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-400">
          この月の記録はありません。
        </Card>
      )}

      <div className="space-y-2.5">
        {days.map((d) => {
          const [y, m, dd] = d.date.split('-').map(Number);
          const dow = new Date(y, m - 1, dd).getDay();
          const holiday = getHolidayName(new Date(y, m - 1, dd));
          const dateColor =
            dow === 0 || holiday
              ? 'text-red-500'
              : dow === 6
                ? 'text-blue-500'
                : 'text-slate-800';

          const sch = d.sch;
          const att = d.att;
          const breaks = (sch?.details ?? []).filter((x) => x.eventType === 'break_out');
          const practice = (sch?.details ?? []).find((x) => x.eventType === 'practice');
          const meal = mealInfo(d.meal);
          const isAbsent = att?.status === 'absent';

          return (
            <Card key={d.date} className="space-y-2.5 p-3.5">
              {/* 日付ヘッダー */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-base font-black ${dateColor}`}>
                    {m}/{dd}
                  </span>
                  <span className={`text-xs font-bold ${dateColor}`}>
                    ({WEEK[dow]})
                  </span>
                  {holiday && (
                    <span className="text-[11px] font-bold text-red-400">{holiday}</span>
                  )}
                </div>
                {isAbsent && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                    欠席
                  </span>
                )}
              </div>

              {/* 予定 */}
              {sch && (
                <InfoRow label="予定">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${planBadge(sch).cls}`}>
                      {planBadge(sch).text}
                    </span>
                    <span className="font-mono">
                      {sch.planIn ?? '—'}
                      {sch.planIn || sch.planOut ? '〜' : ''}
                      {sch.planOut ?? ''}
                    </span>
                  </div>
                  {practice?.note && (
                    <div className="text-[13px] font-bold text-violet-600">
                      実習先：{practice.note}
                    </div>
                  )}
                  {sch.status === 'rejected' && sch.rejectReason && (
                    <div className="text-[13px] text-rose-600">
                      却下の理由：{sch.rejectReason}
                    </div>
                  )}
                </InfoRow>
              )}

              {/* 中抜け */}
              {breaks.length > 0 && (
                <InfoRow label="中抜け">
                  {breaks.map((b) => (
                    <div key={b.id} className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-amber-700">
                        {b.plannedOut ?? '—'}→{b.plannedIn ?? '—'}
                      </span>
                      {b.note && <span className="text-xs text-slate-500">{b.note}</span>}
                    </div>
                  ))}
                </InfoRow>
              )}

              {/* 打刻 */}
              {att && !isAbsent && (
                <InfoRow label="打刻">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono">
                      {att.clockIn ?? '—'}
                      {att.clockIn || att.clockOut ? '〜' : ''}
                      {att.clockOut ?? ''}
                    </span>
                    {att.isLate && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        遅刻
                      </span>
                    )}
                    {att.isEarlyLeave && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        早退
                      </span>
                    )}
                  </div>
                </InfoRow>
              )}

              {/* 理由（欠席・遅刻・早退） */}
              {(att?.absenceReason || att?.lateReason || att?.earlyLeaveReason) && (
                <InfoRow label="理由">
                  <span className="text-[13px] text-slate-500">
                    {att.absenceReason ?? att.lateReason ?? att.earlyLeaveReason}
                  </span>
                </InfoRow>
              )}

              {/* 食事 */}
              {meal && (
                <InfoRow label="食事">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${meal.cls}`}>
                    {meal.text}
                  </span>
                  {/* 却下された申請は、職員が入力した理由をそのまま伝える（予定と同じ扱い） */}
                  {d.meal?.approvalStatus === 'rejected' && d.meal.rejectReason && (
                    <div className="text-[13px] text-rose-600">
                      却下の理由：{d.meal.rejectReason}
                    </div>
                  )}
                </InfoRow>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
