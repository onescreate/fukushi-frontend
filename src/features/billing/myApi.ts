import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface MyBillingRow {
  year: number;
  month: number;
  mealCount: number;
  mealTotal: number;
  cancelCount: number;
  cancelTotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number | null;
  paid: boolean;
  paymentDate: string | null;
}

/** 利用者本人の請求書（確定＝月締め済みの食事代） */
export function useMyBilling() {
  return useQuery<MyBillingRow[]>({
    queryKey: ['my-billing'],
    queryFn: async () =>
      (await apiClient.get<MyBillingRow[]>('/my/billing')).data,
  });
}
