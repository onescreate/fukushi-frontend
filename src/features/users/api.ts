import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { FacilityOption } from '../staff/api';

export interface AppUser {
  id: string;
  corporationId: string;
  facilityId: string;
  loginId: string;
  lastName: string;
  firstName: string;
  kana: string | null;
  certNumber: string | null;
  specialMealFee: number;
  heightCm: string | null;
  status: 'active' | 'withdrawn';
  createdAt: string;
  facility?: { name: string };
}

export interface CreateUserInput {
  loginId: string;
  lastName: string;
  firstName: string;
  kana?: string;
  pin: string;
  password: string;
  facilityId: string;
  certNumber?: string;
  specialMealFee?: number;
  heightCm?: number;
  status?: 'active' | 'withdrawn';
}

export type UpdateUserInput = Partial<
  Omit<CreateUserInput, 'loginId' | 'pin' | 'password'>
>;

const KEY = ['users'];

export function useUsersList() {
  return useQuery<AppUser[]>({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get<AppUser[]>('/users')).data,
  });
}

export function useUsersFacilityOptions(enabled = true) {
  return useQuery<FacilityOption[]>({
    queryKey: ['users', 'facility-options'],
    queryFn: async () =>
      (await apiClient.get<FacilityOption[]>('/users/facility-options')).data,
    enabled,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      apiClient.post<AppUser>('/users', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      apiClient.patch<AppUser>(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useResetUserPin() {
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      apiClient.post(`/users/${id}/reset-pin`, { pin }).then((r) => r.data),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiClient
        .post(`/users/${id}/reset-password`, { password })
        .then((r) => r.data),
  });
}
