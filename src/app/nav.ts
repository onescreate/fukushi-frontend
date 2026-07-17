import {
  Activity,
  BarChart3,
  Building2,
  Clock,
  Database,
  FileCheck2,
  FileText,
  Megaphone,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Settings,
  Percent,
  Receipt,
  Store,
  Tablet,
  Truck,
  UserRound,
  Users,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '../types/me';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** 表示に必要な権限（無指定なら常に表示） */
  permission?: Permission;
  /** ハブ配下の子項目（マスタ管理・設定） */
  children?: NavItem[];
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

const MASTER_CHILDREN: NavItem[] = [
  { label: '利用者管理', to: '/users', icon: UserRound, permission: 'user.view' },
  { label: '職員管理', to: '/staff', icon: Users, permission: 'staff.manage' },
  { label: '店舗管理', to: '/facilities', icon: Store, permission: 'store.manage' },
  { label: '法人管理', to: '/corporations', icon: Building2, permission: 'corporation.manage' },
  { label: '端末管理', to: '/devices', icon: Tablet, permission: 'store.manage' },
];

const SETTINGS_CHILDREN: NavItem[] = [
  { label: '打刻設定', to: '/attendance-settings', icon: Clock, permission: 'attendance.edit' },
  { label: '食事料金', to: '/meal-pricing', icon: UtensilsCrossed, permission: 'settings.price' },
  { label: '消費税設定', to: '/tax-settings', icon: Percent, permission: 'settings.tax' },
  { label: '請求書設定', to: '/invoice-settings', icon: FileText, permission: 'billing.issue' },
];

/** ハブ：サイドバーには1項目、中にカードで子項目を並べる */
export const MASTERS_HUB: NavItem = {
  label: 'マスタ管理',
  to: '/masters',
  icon: Database,
  children: MASTER_CHILDREN,
};
export const SETTINGS_HUB: NavItem = {
  label: '設定',
  to: '/settings',
  icon: Settings,
  children: SETTINGS_CHILDREN,
};

/** 業務の流れに沿ったサイドバー構成。マスタ・設定はハブに集約。 */
export const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ label: 'ダッシュボード', to: '/', icon: LayoutDashboard }],
  },
  {
    title: '毎日の運用',
    items: [
      { label: '当日ロースター', to: '/roster', icon: ListChecks, permission: 'attendance.view' },
      { label: '予定承認', to: '/approvals', icon: CalendarCheck, permission: 'schedule.approve' },
      { label: '食事承認', to: '/meal-approvals', icon: ClipboardCheck, permission: 'meal.manage' },
      { label: 'お知らせ', to: '/announcements', icon: Megaphone, permission: 'announcement.manage' },
    ],
  },
  {
    title: '記録・予定',
    items: [
      { label: '通所予定', to: '/schedules', icon: CalendarDays, permission: 'schedule.view' },
      { label: '打刻データ一覧', to: '/attendance-list', icon: ClipboardList, permission: 'attendance.view' },
      { label: '健康記録', to: '/health-records', icon: Activity, permission: 'health.view' },
      { label: '締め業務', to: '/closing-operations', icon: FileCheck2, permission: 'closing.manage' },
    ],
  },
  {
    title: '食事',
    items: [
      { label: '食事予約', to: '/meal-reservations', icon: Utensils, permission: 'meal.view' },
      { label: '食事納品', to: '/meal-deliveries', icon: Truck, permission: 'meal.delivery.manage' },
      { label: '食事請求', to: '/meal-billing', icon: Receipt, permission: 'billing.view' },
    ],
  },
  {
    title: '分析・管理',
    items: [
      { label: '分析', to: '/analytics', icon: BarChart3, permission: 'attendance.view' },
      MASTERS_HUB,
      SETTINGS_HUB,
    ],
  },
];

/** タイトル解決・現在ページ判定用：全遷移先（ハブ＋子＋トップ項目）をフラット化。 */
export const ALL_DESTINATIONS: NavItem[] = NAV_GROUPS.flatMap((g) =>
  g.items.flatMap((it) => (it.children ? [it, ...it.children] : [it])),
);
