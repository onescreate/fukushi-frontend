import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMyAttendance } from '../../features/attendance/myApi';

const pad = (n: number) => String(n).padStart(2, '0');

export default function PersonalHistoryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const daysInMonth = new Date(year, month, 0).getDate();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const { data, isLoading } = useMyAttendance(from, to);

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

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-800">通所の履歴</h1>
        <p className="text-sm text-slate-500">
          あなたの通所・欠席の記録を確認できます。
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

      <Card className="divide-y p-0">
        {isLoading && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            読み込み中…
          </p>
        )}
        {!isLoading && data?.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            この月の記録はありません。
          </p>
        )}
        {data?.map((r) => (
          <div key={r.date} className="flex items-center gap-3 px-4 py-3">
            <div className="w-24 shrink-0 text-sm font-medium text-slate-700">
              {r.date.slice(5)}
            </div>
            <div className="flex-1">
              {r.status === 'absent' ? (
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                  欠席
                </span>
              ) : (
                <span className="font-mono text-sm text-slate-700">
                  {r.clockIn ?? '—'}
                  {r.clockIn || r.clockOut ? '〜' : ''}
                  {r.clockOut ?? ''}
                </span>
              )}
              {(r.isLate || r.isEarlyLeave) && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  {r.isLate ? '遅刻' : ''}
                  {r.isEarlyLeave ? '早退' : ''}
                </span>
              )}
              {(r.absenceReason || r.lateReason || r.earlyLeaveReason) && (
                <span className="ml-2 text-xs text-slate-400">
                  {r.absenceReason ?? r.lateReason ?? r.earlyLeaveReason}
                </span>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
