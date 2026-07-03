import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export type StaffRole =
  | 'system_admin'
  | 'corporation_admin'
  | 'facility_admin'
  | 'staff';

export const ROLE_LABELS: Record<StaffRole, string> = {
  system_admin: 'システム管理者',
  corporation_admin: '法人管理者',
  facility_admin: '店舗管理者',
  staff: 'スタッフ',
};

/** そのロールが店舗指定を必要とするか */
export const FACILITY_SCOPED_ROLES: StaffRole[] = ['facility_admin', 'staff'];

export interface StaffFacilityRole {
  id: string;
  facilityId: string | null;
  role: StaffRole;
  facility?: { name: string } | null;
}

export interface Staff {
  id: string;
  corporationId: string;
  lastName: string;
  firstName: string;
  email: string;
  status: 'active' | 'inactive';
  facilityRoles: StaffFacilityRole[];
}

export interface FacilityOption {
  id: string;
  name: string;
  corporationId: string;
}

export interface CreateStaffInput {
  lastName: string;
  firstName: string;
  email: string;
  password: string;
  corporationId: string;
  role: StaffRole;
  facilityId?: string;
}

export interface UpdateStaffInput {
  lastName?: string;
  firstName?: string;
  status?: 'active' | 'inactive';
  role?: StaffRole;
  facilityId?: string;
}

const KEY = ['staff'];

export function useStaffList() {
  return useQuery<Staff[]>({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get<Staff[]>('/staff')).data,
  });
}

export function useStaffFacilityOptions(enabled = true) {
  return useQuery<FacilityOption[]>({
    queryKey: ['staff', 'facility-options'],
    queryFn: async () =>
      (await apiClient.get<FacilityOption[]>('/staff/facility-options')).data,
    enabled,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) =>
      apiClient.post<Staff>('/staff', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffInput }) =>
      apiClient.patch<Staff>(`/staff/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/staff/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useResetStaffPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiClient
        .post(`/staff/${id}/reset-password`, { password })
        .then((r) => r.data),
  });
}
