import {
  Building2,
  LayoutDashboard,
  Store,
  UserRound,
  Users,
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
];
