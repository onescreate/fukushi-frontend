import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMySchedules } from '../../features/schedules/myApi';
import type { Schedule } from '../../features/schedules/api';
import { useMyAnnouncements } from '../../features/announcements/api';
import { formatDate } from '../../lib/format';
import { PersonalSubmitDialog } from './PersonalSubmitDialog';

const pad = (n: number) => String(n).padStart(2, '0');
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export default function PersonalSchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [dayDialog, setDayDialog] = useState<{
    date: string;
    existing: Schedule | null;
  } | null>(null);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const { data: schedules } = useMySchedules(from, to);
  const { data: notices } = useMyAnnouncements();

  const byDate = useMemo(() => {
    const map = new Map<string, Schedule>();
    (schedules ?? []).forEach((s) => map.set(s.planDate.slice(0, 10), s));
    return map;
  }, [schedules]);

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      {(notices ?? []).length > 0 && (
        <div className="mb-4 space-y-2">
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
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-800">通所予定</h1>
        <p className="text-sm text-slate-500">
          日付を選んで、通所したい予定を申請できます。
        </p>
      </div>

      <div className="mb-3 flex items-center justify-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="w-28 text-center text-sm font-semibold">
          {year}年 {month}月
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Card className="p-3">
        <div className="mb-1 grid grid-cols-7">
          {WEEK.map((w, i) => (
            <div
              key={w}
              className={`pb-2 text-center text-xs font-semibold ${
                i === 0
                  ? 'text-red-500'
                  : i === 6
                    ? 'text-blue-500'
                    : 'text-slate-400'
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
            const sch = byDate.get(ds);
            return (
              <button
                key={ds}
                onClick={() => setDayDialog({ date: ds, existing: sch ?? null })}
                className="flex min-h-16 flex-col rounded-md border p-1.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className="text-xs font-medium text-slate-700">{day}</span>
                {sch && (
                  <span
                    className={`mt-1 rounded px-1 py-0.5 text-[10px] font-medium ${
                      sch.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : sch.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {sch.status === 'approved'
                      ? '承認済'
                      : sch.status === 'pending'
                        ? '承認待ち'
                        : '却下'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <p className="mt-3 text-center text-xs text-slate-400">
        緑=承認済 / 黄=承認待ち。翌月分は15日までの申請なら自動で承認されます。
      </p>

      {dayDialog && (
        <PersonalSubmitDialog
          open={!!dayDialog}
          onOpenChange={(o) => !o && setDayDialog(null)}
          date={dayDialog.date}
          existing={dayDialog.existing}
        />
      )}
    </div>
  );
}
