export type Permission =
  | 'corporation.manage'
  | 'store.manage'
  | 'staff.manage'
  | 'user.view'
  | 'user.manage'
  | 'schedule.view'
  | 'schedule.submit'
  | 'schedule.approve'
  | 'attendance.view'
  | 'attendance.edit'
  | 'meal.view'
  | 'meal.manage'
  | 'meal.delivery.manage'
  | 'billing.view'
  | 'billing.issue'
  | 'billing.payment'
  | 'settings.price'
  | 'settings.tax'
  | 'health.view'
  | 'health.edit'
  | 'closing.manage';

export interface FacilityRole {
  facilityId: string | null;
  role: string;
}

/** GET /me の応答（ログイン中の本人情報＋権限） */
export interface Me {
  type: 'staff' | 'user';
  id: string;
  name: string;
  email?: string;
  loginId?: string;
  corporationId: string;
  facilityId?: string;
  roles?: FacilityRole[];
  permissions: Permission[];
}
