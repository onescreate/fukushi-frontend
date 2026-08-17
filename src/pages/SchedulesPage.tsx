import { pad } from '@/lib/format';
import { useMemo, useState } from 'react';
import { useMonthNav } from '@/hooks/useMonthNav';
import { AlertTriangle, CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { isReversedRange } from '@/lib/timeRange';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsersList } from '../features/users/api';
import {
  useSchedules,
  type Schedule,
} from '../features/schedules/api';
import { ScheduleDayDialog } from '../features/schedules/ScheduleDayDialog';
import { BulkScheduleDialog } from '../features/schedules/BulkScheduleDialog';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

export default function SchedulesPage() {
  const { data: users } = useUsersList();
  const [userId, setUserId] = useState('');
  const { year, month, changeMonth } = useMonthNav();

  const [dayDialog, setDayDialog] = useState<{
    date: string;
    existing: Schedule | null;
  } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;

  const { data: schedules } = useSchedules(userId, from, to);

  const byDate = useMemo(() => {
    const map = new Map<string, Schedule>();
    (schedules ?? []).forEach((s) => map.set(s.planDate.slice(0, 10), s));
    return map;
  }, [schedules]);


  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <PageHeader
        title="通所予定"
        description="利用者ごとの通所予定を登録・管理します。"
      />

      {/* 操作バー */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Select
            items={Object.fromEntries(
              (users ?? []).map((u) => [u.id, `${u.lastName} ${u.firstName}`]),
            )}
            value={userId || null}
            onValueChange={(v) => setUserId((v as string) ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="利用者を選択" />
            </SelectTrigger>
            <SelectContent>
              {(users ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.lastName} {u.firstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
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

        <div className="ml-auto">
          <Button
            variant="outline"
            disabled={!userId}
            onClick={() => setBulkOpen(true)}
          >
            <CalendarPlus className="size-4" />
            平日を一括登録
          </Button>
        </div>
      </div>

      {!userId ? (
        <Card className="px-6 py-16 text-center text-sm text-muted-foreground">
          上の欄から利用者を選ぶと、その月の予定カレンダーが表示されます。
        </Card>
      ) : (
        <Card className="p-4">
          {/* 曜日ヘッダー */}
          <div className="mb-1 grid grid-cols-7">
            {WEEK.map((w, i) => (
              <div
                key={w}
                className={`pb-2 text-center text-xs font-semibold ${
                  i === 0
                    ? 'text-red-500'
                    : i === 6
                      ? 'text-blue-500'
                      : 'text-muted-foreground'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`e${idx}`} />;
              const ds = `${year}-${pad(month)}-${pad(day)}`;
              const sch = byDate.get(ds);
              const wd = idx % 7;
              return (
                <button
                  key={ds}
                  onClick={() => setDayDialog({ date: ds, existing: sch ?? null })}
                  className={`flex min-h-20 flex-col rounded-md border p-1.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 ${
                    sch ? 'border-primary/30 bg-primary/5' : 'border-border'
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      wd === 0
                        ? 'text-red-500'
                        : wd === 6
                          ? 'text-blue-500'
                          : 'text-foreground'
                    }`}
                  >
                    {day}
                  </span>
                  {sch && (
                    // 開始と終了が逆転している予定（過去に保存されたもの）は色を変えて気づけるようにする
                    <span
                      title={
                        isReversedRange(sch.planIn, sch.planOut)
                          ? '開始と終了が逆になっています。クリックして直してください。'
                          : undefined
                      }
                      className={`mt-1 flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium ${
                        isReversedRange(sch.planIn, sch.planOut)
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {isReversedRange(sch.planIn, sch.planOut) && (
                        <AlertTriangle className="size-3 shrink-0" />
                      )}
                      {sch.planIn ?? ''}
                      {sch.planIn && sch.planOut ? '〜' : ''}
                      {sch.planOut ?? ''}
                    </span>
                  )}
                  {sch?.details?.some((d) => d.eventType === 'practice') && (
                    <span className="mt-0.5 rounded bg-violet-100 px-1 py-0.5 text-[10px] font-medium text-violet-700">
                      実習
                    </span>
                  )}
                  {sch?.details?.some((d) => d.eventType === 'break_out') && (
                    <span className="mt-0.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-700">
                      中抜け
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {dayDialog && userId && (
        <ScheduleDayDialog
          open={!!dayDialog}
          onOpenChange={(o) => !o && setDayDialog(null)}
          userId={userId}
          date={dayDialog.date}
          existing={dayDialog.existing}
        />
      )}

      <BulkScheduleDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        userId={userId}
        year={year}
        month={month}
      />
    </div>
  );
}
