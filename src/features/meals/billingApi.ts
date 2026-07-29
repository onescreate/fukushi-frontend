import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface BillingRow {
  userId: string;
  userName: string;
  mealCount: number;
  mealTotal: number;
  cancelCount: number;
  cancelTotal: number;
  total: number; // 税込
  taxAmount: number; // 内消費税額
  subtotal: number; // 税抜
  taxRate: number | null;
  facilityName?: string | null;
  paymentDate: string | null;
  issuedDate: string | null;
  note: string | null;
}

export interface BillingList {
  year: number;
  month: number;
  taxRate: number | null;
  closed: boolean;
  closedAt: string | null;
  allMode?: boolean;
  rows: BillingRow[];
}

export function useMealBilling(facilityId: string, year: number, month: number) {
  return useQuery<BillingList>({
    queryKey: ['meal-billing', facilityId, year, month],
    queryFn: async () =>
      (
        await apiClient.get<BillingList>('/meal-billing', {
          params: { facilityId, year, month },
        })
      ).data,
    enabled: !!facilityId,
  });
}

export interface BillingDetailItem {
  mealDate: string; // YYYY-MM-DD
  status: 'reserved' | 'eaten' | 'cancelled';
  amount: number;
}

export function useBillingDetail(
  userId: string | null,
  year: number,
  month: number,
) {
  return useQuery<BillingDetailItem[]>({
    queryKey: ['meal-billing', 'detail', userId, year, month],
    queryFn: async () =>
      (
        await apiClient.get<BillingDetailItem[]>('/meal-billing/detail', {
          params: { userId, year, month },
        })
      ).data,
    enabled: !!userId,
  });
}

export function useSetPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      year: number;
      month: number;
      paymentDate: string | null;
    }) => apiClient.patch('/meal-billing/payment', data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['meal-billing'] }),
  });
}

export function useSetIssued() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      year: number;
      month: number;
      issuedDate: string | null;
    }) => apiClient.patch('/meal-billing/issued', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-billing'] });
      qc.invalidateQueries({ queryKey: ['stats', 'badges'] });
    },
  });
}

export function useSetBillingNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      year: number;
      month: number;
      note: string;
    }) => apiClient.patch('/meal-billing/note', data).then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['meal-billing'] }),
  });
}

/** 月締め / 締め解除 */
export function useBillingClose(reopen = false) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { facilityId: string; year: number; month: number }) =>
      apiClient
        .post(`/meal-billing/${reopen ? 'reopen' : 'close'}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-billing'] });
    },
  });
}
