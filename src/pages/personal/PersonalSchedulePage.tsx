import { useMemo, useState } from 'react';
import { useMonthNav } from '@/hooks/useMonthNav';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMySchedules, useMyAlerts, type ReasonKind } from '../../features/schedules/myApi';
import type { Schedule } from '../../features/schedules/api';
import { useMyAnnouncements } from '../../features/announcements/api';
import { formatDate, pad } from '../../lib/format';
import { PersonalSubmitDialog } from './PersonalSubmitDialog';
import { PersonalReasonDialog } from './PersonalReasonDialog';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const KIND_LABEL: Record<ReasonKind, string> = {
  absence: '欠席',
  late: '遅刻',
  early: '早退',
};

export default function PersonalSchedulePage() {
  const { year, month, changeMonth, setYearMonth } = useMonthNav();
  const [dayDialog, setDayDialog] = useState<{
    date: string;
    existing: Schedule | null;
  } | null>(null);
  const [reasonDialog, setReasonDialog] = useState<{
    date: string;
    kind: ReasonKind;
  } | null>(null);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const { data: schedules } = useMySchedules(from, to);
  const { data: notices } = useMyAnnouncements();
  const { data: alerts } = useMyAlerts();

  const byDate = useMemo(() => {
    const map = new Map<string, Schedule>();
    (schedules ?? []).forEach((s) => map.set(s.planDate.slice(0, 10), s));
    return map;
  }, [schedules]);


  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const reasonNeeded = alerts?.reasonNeeded ?? [];
  const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD（ローカル）
  const goToday = () => {
    const now = new Date();
    setYearMonth(now.getFullYear(), now.getMonth() + 1);
  };

  return (
    <div className="space-y-4">
      {/* 理由入力アラート（欠席・遅刻・早退） */}
      {reasonNeeded.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="text-sm font-bold">理由の入力をお願いします</span>
          </div>
          <div className="mt-2.5 space-y-1.5">
            {reasonNeeded.map((r) => (
              <button
                key={`${r.date}-${r.kind}`}
                onClick={() => setReasonDialog({ date: r.date, kind: r.kind })}
                className="flex w-full items-center justify-between rounded-lg bg-white px-3.5 py-2.5 text-left active:bg-amber-100"
              >
                <span className="text-sm font-semibold text-slate-700">
                  {formatDate(r.date)}
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                    {KIND_LABEL[r.kind]}
                  </span>
                </span>
                <span className="text-xs font-bold text-indigo-600">入力する →</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* お知らせ */}
      {(notices ?? []).slice(0, 3).map((n) => (
        <Card key={n.id} className="border-indigo-100 bg-indigo-50/50 p-3.5">
          <div className="flex items-baseline gap-2">
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
              お知らせ
            </span>
            <p className="font-semibold text-slate-800">{n.title}</p>
            <span className="ml-auto text-xs text-slate-400">
              {formatDate(n.publishedOn)}
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{n.body}</p>
        </Card>
      ))}

      {/* カレンダー */}
      <Card className="overflow-hidden p-0">
        {/* ヘッダー：月移動・今日・凡例 */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-100 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[6.5rem] text-center text-base font-bold text-slate-800">
              {year}年 {month}月
            </span>
            <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToday}
              className="ml-1 text-slate-500"
            >
              今日
            </Button>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" />通所
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" />申請中
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500" />却下
            </span>
          </div>
        </div>

        {/* 曜日 */}
        <div className="grid grid-cols-7 px-2 pt-2 sm:px-3">
          {WEEK.map((w, i) => (
            <div
              key={w}
              className={`pb-1.5 text-center text-xs font-bold ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 日セル */}
        <div className="grid grid-cols-7 gap-1 p-2 sm:gap-1.5 sm:p-3">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e${idx}`} />;
            const ds = `${year}-${pad(month)}-${pad(day)}`;
            const sch = byDate.get(ds);
            const hasBreak = (sch?.details ?? []).some(
              (d) => d.eventType === 'break_out',
            );
            const dow = idx % 7;
            const isToday = ds === todayStr;
            return (
              <button
                key={ds}
                onClick={() => setDayDialog({ date: ds, existing: sch ?? null })}
                className={`flex min-h-16 flex-col rounded-lg border p-1.5 text-left transition-colors hover:border-indigo-300 active:bg-slate-50 sm:min-h-20 lg:min-h-24 ${
                  isToday
                    ? 'border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-200'
                    : 'border-slate-200'
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'text-indigo-600'
                      : dow === 0
                        ? 'text-red-500'
                        : dow === 6
                          ? 'text-blue-500'
                          : 'text-slate-600'
                  }`}
                >
                  {day}
                </span>
                {sch && (
                  <span
                    className={`mt-1 rounded-md px-1 py-0.5 text-center text-[10px] font-bold leading-tight sm:text-[11px] ${
                      sch.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : sch.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {sch.status === 'approved'
                      ? '通所'
                      : sch.status === 'pending'
                        ? '申請中'
                        : '却下'}
                  </span>
                )}
                {hasBreak && (
                  <span className="mt-0.5 text-center text-[9px] font-bold text-slate-400 sm:text-[10px]">
                    中抜け
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {dayDialog && (
        <PersonalSubmitDialog
          open={!!dayDialog}
          onOpenChange={(o) => !o && setDayDialog(null)}
          date={dayDialog.date}
          existing={dayDialog.existing}
        />
      )}
      {reasonDialog && (
        <PersonalReasonDialog
          open={!!reasonDialog}
          onOpenChange={(o) => !o && setReasonDialog(null)}
          date={reasonDialog.date}
          kind={reasonDialog.kind}
        />
      )}
    </div>
  );
}
