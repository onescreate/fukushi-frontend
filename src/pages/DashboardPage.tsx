import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  Receipt,
  Store,
  Truck,
  UserRound,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useMe, hasPermission } from '../features/auth/useMe';
import { PageHeader } from '../components/layout/PageHeader';
import { SectionHeader } from '../components/layout/SectionHeader';
import { useFacility } from '../contexts/FacilityContext';
import { useFacilityStats, useBadges } from '../features/stats/api';
import { usePendingCount } from '../features/schedules/approvalApi';
import { usePendingMealCount } from '../features/meals/reservationApi';
import { useHealthMissingCount } from '../features/health/api';
import { useRoster } from '../features/attendance/api';
import { pad } from '../lib/format';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

interface Task {
  label: string;
  hint: string;
  count: number;
  unit: string;
  to: string;
  btn: string;
  icon: LucideIcon;
}

/** KPIミニタイル */
function StatTile({ icon: Icon, label, value, sub, tone = 'slate' }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'slate' | 'indigo' | 'emerald' | 'rose' | 'amber';
}) {
  const toneText: Record<string, string> = {
    slate: 'text-slate-500',
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    amber: 'text-amber-500',
  };
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${toneText[tone]}`} />
        <span className="text-[11.5px] font-bold text-slate-700">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-[20px] font-black leading-none tabular-nums text-slate-800">{value}</span>
        {sub && <span className="text-[11px] font-bold text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: me } = useMe();
  const { facilityId, isAll, facilities } = useFacility();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = `${year}-${pad(month)}-${pad(now.getDate())}`;

  // ---- 各種シグナル ----
  const { data: pending } = usePendingCount(hasPermission(me, 'schedule.approve'));
  const { data: mealPending } = usePendingMealCount(hasPermission(me, 'meal.manage'));
  const canSeeBadges =
    hasPermission(me, 'billing.view') || hasPermission(me, 'meal.delivery.manage');
  const { data: badges } = useBadges(canSeeBadges);
  const { data: healthMissing } = useHealthMissingCount(hasPermission(me, 'health.view'));

  // 当日ロースター（特定店舗のとき）
  const canViewAtt = hasPermission(me, 'attendance.view');
  const rosterFacility = canViewAtt && !isAll ? facilityId : '';
  const { data: roster } = useRoster(rosterFacility, today);
  const notYet = (roster ?? []).filter((r) => r.status === 'notyet').length;
  const mealsToRecord = (roster ?? []).filter((r) => r.meal?.status === 'reserved').length;

  // ---- 今日やること ----
  const tasks: Task[] = [];
  if (hasPermission(me, 'schedule.approve'))
    tasks.push({ label: '通所予定を承認する', hint: '利用者からの予定申請を確認', count: pending?.count ?? 0, unit: '件', to: '/approvals', btn: '承認へ', icon: CalendarCheck });
  if (hasPermission(me, 'meal.manage'))
    tasks.push({ label: '食事予約を承認する', hint: '食事の予約・取消の申請を確認', count: mealPending?.count ?? 0, unit: '件', to: '/meal-approvals', btn: '承認へ', icon: ClipboardCheck });
  if (rosterFacility)
    tasks.push({ label: '未打刻の利用者を確認', hint: '来所予定なのに打刻が無い人', count: notYet, unit: '名', to: '/roster', btn: 'ロースターへ', icon: ListChecks });
  if (rosterFacility)
    tasks.push({ label: '食事の喫食を記録', hint: '予約済みで未記録の食事', count: mealsToRecord, unit: '件', to: '/roster', btn: '記録へ', icon: Utensils });
  if (hasPermission(me, 'meal.delivery.manage'))
    tasks.push({ label: '食事の納品数を入力', hint: '発注に対する納品数の記録', count: badges?.deliveryMissing ?? 0, unit: '日', to: '/meal-deliveries', btn: '入力へ', icon: Truck });
  if (hasPermission(me, 'health.view'))
    tasks.push({ label: '健康記録の未入力を確認', hint: '当月の体重・BMI未記録', count: healthMissing?.count ?? 0, unit: '件', to: '/health-records', btn: '記録へ', icon: Activity });
  if (hasPermission(me, 'billing.view'))
    tasks.push({ label: '未払いの請求を確認', hint: '入金がまだの請求', count: badges?.unpaid ?? 0, unit: '件', to: '/meal-billing', btn: '請求へ', icon: Receipt });

  const totalTodo = tasks.reduce((s, t) => s + t.count, 0);

  // ---- 当月サマリー ----
  const showStats = canViewAtt && !isAll && !!facilityId;
  const { data: stats } = useFacilityStats(showStats ? facilityId : '', year, month);
  const facilityName = facilities.find((f) => f.id === facilityId)?.name;

  return (
    <div className="space-y-8">
      <PageHeader
        title="ダッシュボード"
        description={`ようこそ、${me?.name ?? ''} さん — ${year}年${month}月`}
      />

      {/* 今日やること */}
      {tasks.length > 0 && (
        <section>
          <SectionHeader
            icon={ListChecks}
            title="今日やること"
            right={
              totalTodo === 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="size-3.5" /> すべて対応済み
                </span>
              ) : (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                  未対応 {totalTodo}
                </span>
              )
            }
          />
          <p className="mb-3 text-[12px] font-medium text-slate-400">
            上から順に対応すれば、その日の作業が完了します。数字は対応が必要な件数です。
          </p>
          <div className="overflow-hidden rounded-xl border border-[#ECEDF1] bg-white shadow-[0_1px_2px_rgba(20,20,28,.04)]">
            {tasks.map((t, i) => {
              const Icon = t.icon;
              const done = t.count === 0;
              return (
                <div
                  key={t.to + t.label}
                  className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 ${
                    done ? 'bg-white' : 'bg-rose-50/30'
                  }`}
                >
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black tabular-nums ${
                      done ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Icon className={`size-4 shrink-0 ${done ? 'text-slate-300' : 'text-indigo-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-slate-800">{t.label}</p>
                    <p className="truncate text-[11.5px] font-medium text-slate-400">{t.hint}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                        <CheckCircle2 className="size-3.5" /> 対応不要
                      </span>
                    ) : (
                      <span className="text-[18px] font-black tabular-nums text-rose-600">
                        {t.count}
                        <span className="ml-0.5 text-[11px] font-bold text-rose-400">{t.unit}</span>
                      </span>
                    )}
                  </div>
                  <Link
                    to={t.to}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors ${
                      done
                        ? 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                        : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                    }`}
                  >
                    {t.btn} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 当月サマリー */}
      {canViewAtt && (
        <section>
          <SectionHeader
            icon={CalendarClock}
            title={`当月のサマリー${facilityName && showStats ? `（${facilityName}）` : ''}`}
            right={
              <Link to="/analytics" className="inline-flex items-center gap-1 text-[12px] font-bold text-indigo-600 hover:text-indigo-700">
                分析を開く <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {!showStats ? (
            <div className="rounded-xl border border-[#ECEDF1] bg-white p-8 text-center">
              <Store className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-[13px] font-bold text-slate-500">店舗を選ぶと当月の集計を表示します</p>
              <p className="mt-1 text-[12px] font-medium text-slate-400">ヘッダー右上の店舗切替から選択してください。</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">通所</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <StatTile icon={UserRound} label="予定" value={stats?.attendance.planned ?? '—'} tone="slate" />
                  <StatTile icon={CheckCircle2} label="出席" value={stats?.attendance.present ?? '—'} tone="emerald" />
                  <StatTile icon={UserRound} label="欠席" value={stats?.attendance.absent ?? '—'} tone="rose" />
                  <StatTile icon={UserRound} label="遅刻" value={stats?.attendance.late ?? '—'} tone="amber" />
                  <StatTile icon={UserRound} label="早退" value={stats?.attendance.earlyLeave ?? '—'} tone="amber" />
                  <StatTile icon={Activity} label="出席率" value={stats?.attendance.rate != null ? `${stats.attendance.rate}%` : '—'} tone="indigo" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">食事・請求</p>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile icon={Utensils} label="食事提供数" value={stats?.meals.eaten ?? '—'} sub={stats ? `予約 ${stats.meals.reserved}` : undefined} tone="indigo" />
                  <StatTile icon={Receipt} label="請求総額" value={stats?.billing ? yen(stats.billing.total) : '—'} tone="slate" />
                  <StatTile icon={Wallet} label="入金済" value={stats?.billing ? yen(stats.billing.paidAmount) : '—'} sub={stats?.billing ? `${stats.billing.paidCount}件` : undefined} tone="emerald" />
                  <StatTile icon={Wallet} label="未払い" value={stats?.billing ? yen(stats.billing.unpaidAmount) : '—'} sub={stats?.billing ? `${stats.billing.unpaidCount}件` : undefined} tone="rose" />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {tasks.length === 0 && !canViewAtt && (
        <div className="rounded-xl border border-[#ECEDF1] bg-white p-8 text-center">
          <p className="text-[13px] font-bold text-slate-500">左のメニューから操作を選んでください。</p>
        </div>
      )}
    </div>
  );
}
