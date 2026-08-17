import { useState } from 'react';
import { useMonthNav } from '@/hooks/useMonthNav';
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFacility } from '../contexts/FacilityContext';
import { hasPermission, useMe } from '../features/auth/useMe';
import {
  useAttendanceList,
  type AttendanceListRow,
  type RosterRow,
} from '../features/attendance/api';
import { ManualAttendanceDialog } from '../features/attendance/ManualAttendanceDialog';
import { ManualEditBadge } from '../features/attendance/ManualEditBadge';
import { PlanDetails } from '../features/schedules/PlanDetails';
import { formatDate } from '../lib/format';
import { isReversedRange } from '../lib/timeRange';

const toRosterRow = (r: AttendanceListRow): RosterRow => ({
  userId: r.userId,
  name: r.userName,
  facilityName: r.facilityName,
  planIn: r.planIn,
  planOut: r.planOut,
  scheduleStatus: null,
  practicePlace: r.practicePlace,
  breaks: r.breaks,
  clockIn: r.actIn,
  clockOut: r.actOut,
  status: r.status,
  isLate: false,
  isEarlyLeave: false,
  absenceReason: r.status === 'absent' ? r.reason : null,
  lateReason: null,
  earlyLeaveReason: null,
  manualEditedAt: r.manualEditedAt,
  manualEditedByName: r.manualEditedByName,
  meal: null,
});

/**
 * 開始〜終了の表示。逆転している（終了が開始より前）データには警告マークを付ける。
 * 過去に保存されてしまった逆転データを、消さずに気づけるようにするため。
 */
function TimeRangeCell({
  from,
  to,
}: {
  from: string | null;
  to: string | null;
}) {
  const reversed = isReversedRange(from, to);
  return (
    <span
      className={reversed ? 'font-semibold text-amber-700' : undefined}
      title={reversed ? '開始と終了が逆になっています。編集して直してください。' : undefined}
    >
      {from ?? '—'}
      {from || to ? '〜' : ''}
      {to ?? ''}
      {reversed && (
        <AlertTriangle className="ml-1 inline size-3.5 align-text-top text-amber-600" />
      )}
    </span>
  );
}

function StatusBadge({ status }: { status: AttendanceListRow['status'] }) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (status === 'present') return <span className={`${base} bg-emerald-50 text-emerald-700`}>出席</span>;
  if (status === 'absent') return <span className={`${base} bg-rose-50 text-rose-700`}>欠席</span>;
  return <span className={`${base} bg-amber-50 text-amber-700`}>未打刻</span>;
}

export default function AttendanceListPage() {
  const { data: me } = useMe();
  const canEdit = hasPermission(me, 'attendance.edit');
  const { facilityId, isMulti } = useFacility();
  const { year, month, changeMonth } = useMonthNav();
  const [editing, setEditing] = useState<AttendanceListRow | null>(null);

  const { data, isLoading } = useAttendanceList(facilityId, year, month);


  const colCount = 6 + (isMulti ? 1 : 0) + (canEdit ? 1 : 0);
  const rows = data?.rows ?? [];

  return (
    <div>
      <PageHeader
        title="打刻データ一覧"
        description="月ごとの予定・打刻の実績を一覧で確認・補正します。"
      />

      <div className="mb-4 flex items-center gap-2">
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

      {facilityId && (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>利用者</TableHead>
                {isMulti && <TableHead>店舗</TableHead>}
                <TableHead>予定</TableHead>
                <TableHead>実績</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>理由</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                    この月の打刻データはありません。
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(r.date)}</TableCell>
                    <TableCell className="font-medium text-foreground">{r.userName}</TableCell>
                    {isMulti && (
                      <TableCell className="text-xs text-muted-foreground">{r.facilityName ?? '—'}</TableCell>
                    )}
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      <TimeRangeCell from={r.planIn} to={r.planOut} />
                      <PlanDetails
                        practicePlace={r.practicePlace}
                        breaks={r.breaks}
                        compact
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <TimeRangeCell from={r.actIn} to={r.actOut} />
                        <ManualEditBadge
                          at={r.manualEditedAt}
                          byName={r.manualEditedByName}
                        />
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                      {r.reason ?? '—'}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(r)} title="補正">
                          <Pencil className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <ManualAttendanceDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        row={editing ? toRosterRow(editing) : null}
        date={editing?.date ?? ''}
      />
    </div>
  );
}
