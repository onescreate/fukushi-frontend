import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export type MealStatus = 'reserved' | 'cancelled' | 'revoked' | 'eaten';
export type MealApprovalStatus = 'pending' | 'approved' | 'rejected';
export type MealRequestType = 'reserve' | 'cancel';

export const MEAL_STATUS_LABELS: Record<MealStatus, string> = {
  reserved: '予約',
  cancelled: 'キャンセル',
  revoked: '取消',
  eaten: '喫食済',
};

export interface Meal {
  id: string;
  userId: string;
  facilityId: string;
  mealDate: string; // YYYY-MM-DD
  status: MealStatus;
  amount: number;
  approvalStatus: MealApprovalStatus;
  requestType: MealRequestType | null;
}

export interface MealWithUser extends Meal {
  userName: string;
  facilityName?: string | null;
}

// ---------- 利用者本人 ----------

export function useMyMeals(from: string, to: string) {
  return useQuery<Meal[]>({
    queryKey: ['my-meals', from, to],
    queryFn: async () =>
      (await apiClient.get<Meal[]>('/my/meals', { params: { from, to } })).data,
  });
}

export interface MySubmitMealResult {
  reserved: number;
  pendingReserve: number;
  revoked: number;
  pendingCancel: number;
  skipped: { date: string; reason: string }[];
}

export function useMySubmitMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { dates: string[]; action: 'reserve' | 'cancel' }) =>
      apiClient
        .post<MySubmitMealResult>('/my/meals', data)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-meals'] }),
  });
}

// ---------- 管理側 ----------

export function useMealReservations(
  facilityId: string,
  from: string,
  to: string,
) {
  return useQuery<MealWithUser[]>({
    queryKey: ['meal-reservations', facilityId, from, to],
    queryFn: async () =>
      (
        await apiClient.get<MealWithUser[]>('/meal-reservations', {
          params: { facilityId, from, to },
        })
      ).data,
    enabled: !!facilityId,
  });
}

export function useAdminMealUpsert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      date: string;
      status: MealStatus;
      situation?: string;
    }) => apiClient.post('/meal-reservations', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-reservations'] });
      qc.invalidateQueries({ queryKey: ['meal-pending'] });
      qc.invalidateQueries({ queryKey: ['roster'] });
    },
  });
}

// ---------- 承認 ----------

export function usePendingMeals(enabled = true) {
  return useQuery<MealWithUser[]>({
    queryKey: ['meal-pending'],
    queryFn: async () =>
      (await apiClient.get<MealWithUser[]>('/meal-reservations/pending')).data,
    enabled,
  });
}

export function usePendingMealCount(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: ['meal-pending', 'count'],
    queryFn: async () =>
      (
        await apiClient.get<{ count: number }>(
          '/meal-reservations/pending/count',
        )
      ).data,
    enabled,
    refetchInterval: 60_000,
  });
}

export function useDecideMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: 'approve' | 'reject';
    }) => apiClient.patch(`/meal-reservations/${id}/${decision}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-pending'] });
      qc.invalidateQueries({ queryKey: ['meal-reservations'] });
      qc.invalidateQueries({ queryKey: ['roster'] });
    },
  });
}
