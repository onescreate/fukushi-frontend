import { useMemo, useState } from 'react';
import { CalendarCheck, Check, ListChecks, Pencil, Utensils, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useRoster, type RosterRow } from '../features/attendance/api';
import { useAdminMealUpsert } from '../features/meals/reservationApi';
import {
  useDecideSchedule,
  usePendingSchedules,
} from '../features/schedules/approvalApi';
import { ManualAttendanceDialog } from '../features/attendance/ManualAttendanceDialog';
import { getApiErrorMessage } from '../lib/errors';
import { formatDate, pad } from '../lib/format';


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
  const canApprove = hasPermission(me, 'schedule.approve');
  const { facilityId, isAll } = useFacility();
  const now = new Date();
  const [date, setDate] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  );
  const [editing, setEditing] = useState<RosterRow | null>(null);

  const { data: rows, isLoading } = useRoster(facilityId, date);
  const mealUpsert = useAdminMealUpsert();
  const { data: pending } = usePendingSchedules(canApprove);
  const decide = useDecideSchedule();

  const setMeal = async (row: RosterRow, status: 'reserved' | 'eaten') => {
    try {
      await mealUpsert.mutateAsync({ userId: row.userId, date, status });
      toast.success(status === 'eaten' ? '喫食を記録しました' : '喫食を取り消しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDecide = async (id: string, decision: 'approve' | 'reject') => {
    try {
      await decide.mutateAsync({ id, decision });
      toast.success(decision === 'approve' ? '承認しました' : '却下しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  // サマリー集計（表示中の店舗×日から算出）
  const summary = useMemo(() => {
    const list = rows ?? [];
    const hasPlan = (r: RosterRow) => r.scheduleStatus === 'approved' || !!r.planIn;
    const activePlan = list.filter((r) => hasPlan(r) && r.status !== 'absent');
    const arrived = list.filter((r) => r.status === 'present').length;
    const notArrived = activePlan.filter((r) => r.status === 'notyet');
    const mealUsers = list.filter((r) => r.meal);
    return {
      activePlan: activePlan.length,
      arrived,
      notArrived,
      mealUsers,
      late: list.filter((r) => r.isLate).length,
      early: list.filter((r) => r.isEarlyLeave).length,
      missing: notArrived.length,
    };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="当日ロースター"
        description="その日の通所状況・食事・承認待ちをまとめて確認します。"
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
        />
      </div>

      {!facilityId ? (
        <Card className="px-6 py-16 text-center text-sm text-muted-foreground">
          ヘッダーで店舗を選ぶと、その日の状況が表示されます。
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 1. サマリー */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-3 flex items-end justify-between border-b pb-3">
                <h3 className="text-base font-bold text-foreground">通所状況</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tabular-nums text-foreground">
                    {summary.arrived}
                  </span>
                  <span className="text-lg text-muted-foreground">/</span>
                  <span className="text-lg font-bold tabular-nums text-muted-foreground">
                    {summary.activePlan}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">名</span>
                </div>
              </div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                未打刻（来所予定）
              </p>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {summary.notArrived.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">
                    未打刻の利用者はいません
                  </p>
                ) : (
                  summary.notArrived.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => canEdit && setEditing(u)}
                      className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-left transition-colors hover:border-indigo-300 hover:bg-accent/40"
                    >
                      <span className="text-sm font-semibold text-foreground">{u.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {u.planIn ?? '—'} 〜 {u.planOut ?? ''}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-3 flex items-end justify-between border-b pb-3">
                <h3 className="text-base font-bold text-foreground">昼食注文</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tabular-nums text-foreground">
                    {summary.mealUsers.length}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">食</span>
                </div>
              </div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-orange-500">
                食事予定者
              </p>
              <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto">
                {summary.mealUsers.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">食事予定者はいません</p>
                ) : (
                  summary.mealUsers.map((u) => (
                    <span
                      key={u.userId}
                      className={`rounded-md border px-2.5 py-1 text-sm font-medium ${
                        u.meal?.status === 'eaten'
                          ? 'border-orange-200 bg-orange-50 text-orange-700'
                          : 'bg-muted/40 text-foreground'
                      }`}
                    >
                      {u.name}
                    </span>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* 2. 名簿・打刻リスト */}
          <div>
            <SectionHeader
              icon={ListChecks}
              title="名簿・打刻リスト"
              right={
                <>
                  {summary.missing > 0 && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      未打刻 {summary.missing}
                    </span>
                  )}
                  {summary.late > 0 && (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                      遅刻 {summary.late}
                    </span>
                  )}
                  {summary.early > 0 && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                      早退 {summary.early}
                    </span>
                  )}
                </>
              }
            />
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>氏名</TableHead>
                    {isAll && <TableHead>店舗</TableHead>}
                    <TableHead>予定</TableHead>
                    <TableHead>打刻</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>食事</TableHead>
                    <TableHead>備考</TableHead>
                    {canEdit && <TableHead className="w-16 text-right">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={(canEdit ? 7 : 6) + (isAll ? 1 : 0)} className="py-10 text-center text-muted-foreground">
                        読み込み中…
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && rows?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={(canEdit ? 7 : 6) + (isAll ? 1 : 0)} className="py-10 text-center text-muted-foreground">
                        この日の利用者はいません。
                      </TableCell>
                    </TableRow>
                  )}
                  {rows?.map((r) => (
                    <TableRow key={r.userId}>
                      <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                      {isAll && (
                        <TableCell className="text-xs text-muted-foreground">
                          {r.facilityName ?? '—'}
                        </TableCell>
                      )}
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
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {r.meal ? (
                            <>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  r.meal.status === 'eaten'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {r.meal.status === 'eaten' ? '喫食済' : '予約'}
                              </span>
                              {canEdit &&
                                (r.meal.status === 'reserved' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-[11px]"
                                    disabled={mealUpsert.isPending}
                                    onClick={() => setMeal(r, 'eaten')}
                                  >
                                    喫食
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[11px] text-muted-foreground"
                                    disabled={mealUpsert.isPending}
                                    onClick={() => setMeal(r, 'reserved')}
                                  >
                                    取消
                                  </Button>
                                ))}
                            </>
                          ) : canEdit ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
                              disabled={mealUpsert.isPending}
                              onClick={() => setMeal(r, 'eaten')}
                              title="当日食を記録"
                            >
                              <Utensils className="size-3" />
                              当日食
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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
          </div>

          {/* 3. 承認待ちリスト */}
          {canApprove && (
            <div>
              <SectionHeader
                icon={CalendarCheck}
                title="承認待ちリスト"
                right={
                  (pending ?? []).length > 0 ? (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                      {(pending ?? []).length} 件
                    </span>
                  ) : undefined
                }
              />
              <Card className="overflow-hidden p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>利用者</TableHead>
                      <TableHead>対象日</TableHead>
                      <TableHead>時間</TableHead>
                      <TableHead>連絡事項</TableHead>
                      <TableHead className="w-40 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(pending ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          承認待ちの申請はありません。
                        </TableCell>
                      </TableRow>
                    ) : (
                      (pending ?? []).map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-foreground">
                            {s.user.lastName} {s.user.firstName}
                          </TableCell>
                          <TableCell>{formatDate(s.planDate)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {s.planIn ?? ''}
                            {s.planIn && s.planOut ? '〜' : ''}
                            {s.planOut ?? ''}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{s.note ?? '—'}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => handleDecide(s.id, 'approve')} disabled={decide.isPending}>
                                <Check className="size-4" />
                                承認
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDecide(s.id, 'reject')} disabled={decide.isPending}>
                                <X className="size-4" />
                                却下
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
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
