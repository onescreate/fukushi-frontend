import {
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  Megaphone,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
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
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'ダッシュボード', to: '/', icon: LayoutDashboard },
  {
    label: '分析',
    to: '/analytics',
    icon: BarChart3,
    permission: 'attendance.view',
  },
  {
    label: '法人管理',
    to: '/corporations',
    icon: Building2,
    permission: 'corporation.manage',
  },
  { label: '店舗管理', to: '/facilities', icon: Store, permission: 'store.manage' },
  { label: '職員管理', to: '/staff', icon: Users, permission: 'staff.manage' },
  {
    label: '利用者管理',
    to: '/users',
    icon: UserRound,
    permission: 'user.view',
  },
  {
    label: '通所予定',
    to: '/schedules',
    icon: CalendarDays,
    permission: 'schedule.view',
  },
  {
    label: '予定承認',
    to: '/approvals',
    icon: CalendarCheck,
    permission: 'schedule.approve',
  },
  {
    label: '食事予約',
    to: '/meal-reservations',
    icon: Utensils,
    permission: 'meal.view',
  },
  {
    label: '食事承認',
    to: '/meal-approvals',
    icon: ClipboardCheck,
    permission: 'meal.manage',
  },
  {
    label: '食事請求',
    to: '/meal-billing',
    icon: Receipt,
    permission: 'billing.view',
  },
  {
    label: '食事納品',
    to: '/meal-deliveries',
    icon: Truck,
    permission: 'meal.delivery.manage',
  },
  {
    label: '請求書設定',
    to: '/invoice-settings',
    icon: FileText,
    permission: 'billing.issue',
  },
  { label: '端末管理', to: '/devices', icon: Tablet, permission: 'store.manage' },
  {
    label: '打刻設定',
    to: '/attendance-settings',
    icon: Settings,
    permission: 'attendance.edit',
  },
  {
    label: '食事料金',
    to: '/meal-pricing',
    icon: UtensilsCrossed,
    permission: 'settings.price',
  },
  {
    label: '消費税設定',
    to: '/tax-settings',
    icon: Percent,
    permission: 'settings.tax',
  },
  {
    label: 'お知らせ',
    to: '/announcements',
    icon: Megaphone,
    permission: 'announcement.manage',
  },
  { label: 'ヘルプ・使い方', to: '/help', icon: BookOpen },
];
