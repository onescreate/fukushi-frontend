import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Receipt,
  Store,
  Truck,
  UserRound,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useMe, hasPermission } from '../features/auth/useMe';
import { useFacility } from '../contexts/FacilityContext';
import { useFacilityStats, useBadges } from '../features/stats/api';
import { usePendingCount } from '../features/schedules/approvalApi';
import { usePendingMealCount } from '../features/meals/reservationApi';
import { useHealthMissingCount } from '../features/health/api';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

/** KGI風セクション見出し */
function SectionHeader({ icon: Icon, title, right }: { icon: LucideIcon; title: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 border-b-2 border-slate-200 pb-2">
      <Icon className="size-4 text-slate-400" />
      <h2 className="text-[14px] font-bold text-slate-800">{title}</h2>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
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

  // ---- 要対応（グローバル） ----
  const { data: pending } = usePendingCount(hasPermission(me, 'schedule.approve'));
  const { data: mealPending } = usePendingMealCount(hasPermission(me, 'meal.manage'));
  const canSeeBadges =
    hasPermission(me, 'billing.view') || hasPermission(me, 'meal.delivery.manage');
  const { data: badges } = useBadges(canSeeBadges);
  const { data: healthMissing } = useHealthMissingCount(hasPermission(me, 'health.view'));

  const alerts = [
    { label: '承認待ちの予定', to: '/approvals', icon: CalendarCheck, count: pending?.count ?? 0, show: hasPermission(me, 'schedule.approve') },
    { label: '承認待ちの食事', to: '/meal-approvals', icon: ClipboardCheck, count: mealPending?.count ?? 0, show: hasPermission(me, 'meal.manage') },
    { label: '未払いの請求', to: '/meal-billing', icon: Receipt, count: badges?.unpaid ?? 0, show: hasPermission(me, 'billing.view') },
    { label: '納品の未入力', to: '/meal-deliveries', icon: Truck, count: badges?.deliveryMissing ?? 0, show: hasPermission(me, 'meal.delivery.manage') },
    { label: '健康記録の未入力', to: '/health-records', icon: Activity, count: healthMissing?.count ?? 0, show: hasPermission(me, 'health.view') },
  ].filter((a) => a.show);
  const totalTodo = alerts.reduce((s, a) => s + a.count, 0);

  // ---- 当月サマリー（特定店舗のみ） ----
  const canViewStats = hasPermission(me, 'attendance.view');
  const showStats = canViewStats && !isAll && !!facilityId;
  const { data: stats } = useFacilityStats(showStats ? facilityId : '', year, month);
  const facilityName = facilities.find((f) => f.id === facilityId)?.name;

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ホーム</p>
        <h1 className="mt-0.5 text-[22px] font-black tracking-tight text-slate-800">
          ようこそ、{me?.name ?? ''} さん
        </h1>
        <p className="mt-1 text-[12.5px] font-semibold text-slate-500">
          {year}年{month}月の状況です。
        </p>
      </div>

      {/* 要対応インボックス */}
      {alerts.length > 0 && (
        <section>
          <SectionHeader
            icon={Inbox}
            title="要対応"
            right={
              totalTodo === 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <CheckCircle2 className="size-3.5" /> すべて対応済み
                </span>
              ) : (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                  {totalTodo} 件
                </span>
              )
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {alerts.map((a) => {
              const Icon = a.icon;
              const active = a.count > 0;
              return (
                <Link
                  key={a.to}
                  to={a.to}
                  className={`group rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 ${
                    active
                      ? 'border-rose-200 bg-rose-50 hover:shadow-md'
                      : 'border-[#ECEDF1] bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex size-8 items-center justify-center rounded-lg ${active ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Icon className="size-4" />
                    </div>
                    <ArrowUpRight className={`size-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${active ? 'text-rose-300' : 'text-slate-300'}`} />
                  </div>
                  <div className={`mt-2 text-[24px] font-black leading-none tabular-nums ${active ? 'text-rose-600' : 'text-slate-300'}`}>
                    {a.count}
                  </div>
                  <div className="mt-1 text-[12px] font-bold text-slate-600">{a.label}</div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 当月サマリー */}
      {canViewStats && (
        <section>
          <SectionHeader
            icon={CalendarClock}
            title={`当月のサマリー${facilityName && showStats ? `（${facilityName}）` : ''}`}
            right={
              <Link to="/analytics" className="inline-flex items-center gap-1 text-[12px] font-bold text-indigo-600 hover:text-indigo-700">
                分析を開く <ArrowUpRight className="size-3.5" />
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
              {/* 通所 */}
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
              {/* 食事・請求 */}
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

      {/* 権限が少ないユーザー向けのフォールバック */}
      {alerts.length === 0 && !canViewStats && (
        <div className="rounded-xl border border-[#ECEDF1] bg-white p-8 text-center">
          <p className="text-[13px] font-bold text-slate-500">左のメニューから操作を選んでください。</p>
        </div>
      )}
    </div>
  );
}
