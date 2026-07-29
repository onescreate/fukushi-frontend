import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Activity,
  ArrowUpRight,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  FileText,
  Inbox,
  Pencil,
  Receipt,
  Store,
  Truck,
  UserRound,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import { useMe, hasPermission } from '../features/auth/useMe';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useFacility } from '../contexts/FacilityContext';
import { useBadges } from '../features/stats/api';
import { useRoster, type RosterRow } from '../features/attendance/api';
import { useAdminMealUpsert } from '../features/meals/reservationApi';
import { ManualAttendanceDialog } from '../features/attendance/ManualAttendanceDialog';
import { getApiErrorMessage } from '../lib/errors';
import { pad } from '../lib/format';

/** 今日の集計タイル */
function CountTile({ icon: Icon, label, value, tone }: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const cls = {
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
    slate: 'text-slate-400',
  }[tone];
  return (
    <div className="rounded-xl border border-[#ECEDF1] bg-white p-3.5 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${cls}`} />
        <span className="text-[11.5px] font-bold text-slate-600">{label}</span>
      </div>
      <div className="mt-1 text-[22px] font-black leading-none tabular-nums text-slate-800">
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: me } = useMe();
  const canEdit = hasPermission(me, 'attendance.edit');
  const { facilityId, isMulti } = useFacility();
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const [editing, setEditing] = useState<RosterRow | null>(null);

  // ---- 要対応（グローバル）: バッジは1本のエンドポイント(/stats/badges)に集約 ----
  const canApprove = hasPermission(me, 'schedule.approve');
  const canApproveMeal = hasPermission(me, 'meal.manage');
  const canSeeBilling = hasPermission(me, 'billing.view');
  const canSeeDelivery = hasPermission(me, 'meal.delivery.manage');
  const canSeeHealth = hasPermission(me, 'health.view');
  const { data: badges } = useBadges(
    canApprove || canApproveMeal || canSeeBilling || canSeeDelivery || canSeeHealth,
  );
  const alerts = [
    { label: '承認待ちの予定', to: '/approvals', icon: CalendarCheck, count: badges?.pendingSchedule ?? 0, show: canApprove },
    { label: '承認待ちの食事', to: '/meal-approvals', icon: ClipboardCheck, count: badges?.pendingMeal ?? 0, show: canApproveMeal },
    { label: '未発行の請求書', to: '/meal-billing', icon: FileText, count: badges?.unissued ?? 0, show: canSeeBilling },
    { label: '未入金の請求', to: '/meal-billing', icon: Receipt, count: badges?.unpaid ?? 0, show: canSeeBilling },
    { label: '納品の未入力', to: '/meal-deliveries', icon: Truck, count: badges?.deliveryMissing ?? 0, show: canSeeDelivery },
    { label: '健康記録の未入力', to: '/health-records', icon: Activity, count: badges?.healthMissing ?? 0, show: canSeeHealth },
  ].filter((a) => a.show);

  // ---- 今日の来所（選択中の店舗・複数可） ----
  const canViewAtt = hasPermission(me, 'attendance.view');
  const rosterFacility = canViewAtt ? facilityId : '';
  const { data: rows } = useRoster(rosterFacility, today);
  const list = rows ?? [];
  const present = list.filter((r) => r.status === 'present');
  const notYet = list.filter((r) => r.status === 'notyet' && (r.planIn || r.scheduleStatus === 'approved'));
  const mealUsers = list.filter((r) => r.meal);
  const eaten = list.filter((r) => r.meal?.status === 'eaten');
  const lateEarly = list.filter((r) => r.isLate || r.isEarlyLeave);

  const mealUpsert = useAdminMealUpsert();
  const setMeal = async (row: RosterRow, status: 'reserved' | 'eaten') => {
    try {
      await mealUpsert.mutateAsync({ userId: row.userId, date: today, status });
      toast.success(status === 'eaten' ? '喫食を記録しました' : '喫食を取り消しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="ダッシュボード"
        description={`ようこそ、${me?.name ?? ''} さん`}
      />

      {/* 要対応 */}
      {alerts.length > 0 && (
        <section>
          <SectionHeader icon={Inbox} title="要対応" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {alerts.map((a) => {
              const Icon = a.icon;
              const active = a.count > 0;
              return (
                <Link
                  key={a.label}
                  to={a.to}
                  className={`group rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 ${
                    active ? 'border-rose-200 bg-rose-50 hover:shadow-md' : 'border-[#ECEDF1] bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${active ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Icon className="size-4" />
                    </div>
                    <ArrowUpRight className={`size-4 shrink-0 ${active ? 'text-rose-300' : 'text-slate-300'}`} />
                  </div>
                  <div className={`mt-2 text-[24px] font-black leading-none tabular-nums ${active ? 'text-rose-600' : 'text-slate-300'}`}>{a.count}</div>
                  <div className="mt-1 text-[12px] font-bold text-slate-600">{a.label}</div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 今日の来所 */}
      {canViewAtt && (
        <section>
          <SectionHeader icon={Users} title="今日の来所" />
          {!rosterFacility ? (
            <div className="rounded-xl border border-[#ECEDF1] bg-white p-8 text-center">
              <Store className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-[13px] font-bold text-slate-500">店舗を選ぶと今日の来所状況を表示します</p>
              <p className="mt-1 text-[12px] font-medium text-slate-400">ヘッダー右上の店舗切替から選択してください。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 集計タイル */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <CountTile icon={UserRound} label="来所" value={present.length} tone="emerald" />
                <CountTile icon={Utensils} label="喫食" value={eaten.length} tone="indigo" />
                <CountTile icon={Clock} label="未打刻" value={notYet.length} tone="amber" />
                <CountTile icon={Clock} label="遅刻" value={list.filter((r) => r.isLate).length} tone="rose" />
                <CountTile icon={Clock} label="早退" value={list.filter((r) => r.isEarlyLeave).length} tone="rose" />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* 来所者一覧（打刻編集） */}
                <div className="rounded-xl border border-[#ECEDF1] bg-white shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                    <p className="text-[13px] font-bold text-slate-800">来所者</p>
                    <span className="text-[12px] font-bold text-slate-400">{present.length} 名</span>
                  </div>
                  <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {present.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[12px] font-medium text-slate-400">まだ来所打刻がありません。</p>
                    ) : (
                      present.map((r) => (
                        <div key={r.userId} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-slate-800">{r.name}</p>
                            {isMulti && r.facilityName && (
                              <p className="truncate text-[10px] font-medium text-slate-400">{r.facilityName}</p>
                            )}
                          </div>
                          <span className="font-mono text-[12px] text-slate-500">
                            {r.clockIn ?? '—'}{r.clockIn || r.clockOut ? '〜' : ''}{r.clockOut ?? ''}
                          </span>
                          {r.isLate && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">遅刻</span>}
                          {r.isEarlyLeave && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">早退</span>}
                          {canEdit && (
                            <button onClick={() => setEditing(r)} title="打刻を編集" className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600">
                              <Pencil className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 喫食者一覧（喫食編集） */}
                <div className="rounded-xl border border-[#ECEDF1] bg-white shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                    <p className="text-[13px] font-bold text-slate-800">喫食者</p>
                    <span className="text-[12px] font-bold text-slate-400">喫食 {eaten.length} / 予定 {mealUsers.length}</span>
                  </div>
                  <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                    {mealUsers.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[12px] font-medium text-slate-400">今日の食事予定はありません。</p>
                    ) : (
                      mealUsers.map((r) => {
                        const ate = r.meal?.status === 'eaten';
                        return (
                          <div key={r.userId} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-slate-800">{r.name}</p>
                            {isMulti && r.facilityName && (
                              <p className="truncate text-[10px] font-medium text-slate-400">{r.facilityName}</p>
                            )}
                          </div>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ate ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                              {ate ? '喫食済' : '予約'}
                            </span>
                            {canEdit && (
                              ate ? (
                                <button onClick={() => setMeal(r, 'reserved')} disabled={mealUpsert.isPending} className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-100">
                                  取消
                                </button>
                              ) : (
                                <button onClick={() => setMeal(r, 'eaten')} disabled={mealUpsert.isPending} className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700">
                                  喫食
                                </button>
                              )
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* 遅刻・早退リスト */}
              {lateEarly.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/40 shadow-[0_1px_2px_rgba(20,20,28,.04)]">
                  <div className="flex items-center justify-between border-b border-rose-100 px-4 py-2.5">
                    <p className="text-[13px] font-bold text-rose-700">遅刻・早退</p>
                    <span className="text-[12px] font-bold text-rose-400">{lateEarly.length} 名</span>
                  </div>
                  <div className="divide-y divide-rose-100">
                    {lateEarly.map((r) => (
                      <div key={r.userId} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-slate-800">{r.name}</p>
                            {isMulti && r.facilityName && (
                              <p className="truncate text-[10px] font-medium text-slate-400">{r.facilityName}</p>
                            )}
                          </div>
                        {r.isLate && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">遅刻</span>}
                        {r.isEarlyLeave && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">早退</span>}
                        <span className="truncate text-[12px] font-medium text-slate-500">
                          {r.lateReason ?? r.earlyLeaveReason ?? '理由未入力'}
                        </span>
                        {canEdit && (
                          <button onClick={() => setEditing(r)} title="打刻・理由を編集" className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-indigo-600">
                            <Pencil className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <ManualAttendanceDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        row={editing}
        date={today}
      />
    </div>
  );
}
