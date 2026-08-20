import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface DeliveryDay {
  /** 発注数（予約＋喫食済＋キャンセル。キャンセルも食事は届くため含む） */
  orderCount: number;
  /** 発注数のうちキャンセル分（内訳表示用） */
  cancelledCount: number;
  deliveryCount: number | null;
  note: string | null;
}

export interface DeliveryMonthly {
  year: number;
  month: number;
  allMode?: boolean;
  days: Record<string, DeliveryDay>;
  unentered: string[];
  mismatch: { date: string; orderCount: number; deliveryCount: number }[];
}

export function useMealDeliveries(
  facilityId: string,
  year: number,
  month: number,
) {
  return useQuery<DeliveryMonthly>({
    queryKey: ['meal-deliveries', facilityId, year, month],
    queryFn: async () =>
      (
        await apiClient.get<DeliveryMonthly>(`/meal-deliveries/${facilityId}`, {
          params: { year, month },
        })
      ).data,
    enabled: !!facilityId,
  });
}

export function useSetDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilityId,
      date,
      deliveryCount,
      note,
    }: {
      facilityId: string;
      date: string;
      deliveryCount: number;
      note?: string;
    }) =>
      apiClient
        .post(`/meal-deliveries/${facilityId}`, { date, deliveryCount, note })
        .then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['meal-deliveries', v.facilityId] }),
  });
}
