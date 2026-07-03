import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUsersFacilityOptions } from '../features/users/api';
import { hasPermission, useMe } from '../features/auth/useMe';
import { useRoster, type RosterRow } from '../features/attendance/api';
import { ManualAttendanceDialog } from '../features/attendance/ManualAttendanceDialog';

const pad = (n: number) => String(n).padStart(2, '0');

function StatusBadge({ row }: { row: RosterRow }) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  if (row.status === 'present')
    return <span className={`${base} bg-emerald-50 text-emerald-700`}>出席</span>;
  if (row.status === 'absent')
    return <span className={`${base} bg-rose-50 text-rose-700`}>欠席</span>;
  return <span className={`${base} bg-amber-50 text-amber-700`}>未打刻</span>;
}

export default function RosterPage() {
  const { data: me } = useMe();
  const canEdit = hasPermission(me, 'attendance.edit');
  const { data: facilities } = useUsersFacilityOptions();
  const [facilityId, setFacilityId] = useState('');
  const now = new Date();
  const [date, setDate] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  );
  const [editing, setEditing] = useState<RosterRow | null>(null);

  const { data: rows, isLoading } = useRoster(facilityId, date);

  return (
    <div>
      <PageHeader
        title="当日ロースター"
        description="その日の利用者の予定・打刻状況・欠席/遅刻/早退を確認します。"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            items={Object.fromEntries(
              (facilities ?? []).map((f) => [f.id, f.name]),
            )}
            value={facilityId || null}
            onValueChange={(v) => setFacilityId((v as string) ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="店舗を選択" />
            </SelectTrigger>
            <SelectContent>
              {(facilities ?? []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </div>

      {!facilityId ? (
        <Card className="px-6 py-16 text-center text-sm text-muted-foreground">
          店舗を選ぶと、その日の利用者一覧が表示されます。
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>予定</TableHead>
                <TableHead>打刻</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>備考</TableHead>
                {canEdit && <TableHead className="w-16 text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && rows?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    この日の利用者はいません。
                  </TableCell>
                </TableRow>
              )}
              {rows?.map((r) => (
                <TableRow key={r.userId}>
                  <TableCell className="font-medium text-foreground">
                    {r.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="font-mono">
                      {r.planIn ?? '—'}
                      {r.planIn || r.planOut ? '〜' : ''}
                      {r.planOut ?? ''}
                    </div>
                    {r.breaks.map((b, i) => (
                      <div key={i} className="mt-0.5 text-amber-600">
                        中抜け {b.plannedOut ?? '—'}〜{b.plannedIn ?? '—'}
                        {b.note ? `（${b.note}）` : ''}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.clockIn ?? '—'}
                    {r.clockIn || r.clockOut ? '〜' : ''}
                    {r.clockOut ?? ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <StatusBadge row={r} />
                      {r.isLate && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          遅刻
                        </span>
                      )}
                      {r.isEarlyLeave && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          早退
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                    {r.absenceReason ?? r.lateReason ?? r.earlyLeaveReason ?? '—'}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(r)}
                          title="補正"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ManualAttendanceDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        row={editing}
        date={date}
      />
    </div>
  );
}
