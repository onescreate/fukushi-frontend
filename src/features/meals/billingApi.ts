import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface BillingRow {
  userId: string;
  userName: string;
  mealCount: number;
  mealTotal: number;
  cancelTotal: number;
  total: number; // 税込
  taxAmount: number; // 内消費税額
  subtotal: number; // 税抜
  taxRate: number | null;
  paymentDate: string | null;
  note: string | null;
}

export interface BillingList {
  year: number;
  month: number;
  taxRate: number | null;
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
