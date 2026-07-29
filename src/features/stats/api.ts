import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface FacilityStats {
  year: number;
  month: number;
  attendance: {
    planned: number;
    present: number;
    absent: number;
    late: number;
    earlyLeave: number;
    rate: number | null; // 出席/予定 の%
  };
  meals: {
    reserved: number;
    eaten: number;
    cancelled: number;
    ordered: number; // reserved + eaten
  };
  billing: {
    total: number;
    paidAmount: number;
    paidCount: number;
    unpaidAmount: number;
    unpaidCount: number;
    closed: boolean;
  } | null;
}

export interface Badges {
  unpaid: number;
  /** 締め済みの月で、まだ請求書を発行していない件数 */
  unissued: number;
  deliveryMissing: number;
  pendingSchedule: number;
  pendingMeal: number;
  healthMissing: number;
}

export function useBadges(enabled = true) {
  return useQuery<Badges>({
    queryKey: ['stats', 'badges'],
    queryFn: async () =>
      (await apiClient.get<Badges>('/stats/badges')).data,
    enabled,
    refetchInterval: 60_000,
  });
}

export function useFacilityStats(
  facilityId: string,
  year: number,
  month: number,
) {
  return useQuery<FacilityStats>({
    queryKey: ['stats', 'facility', facilityId, year, month],
    queryFn: async () =>
      (
        await apiClient.get<FacilityStats>('/stats/facility', {
          params: { facilityId, year, month },
        })
      ).data,
    enabled: !!facilityId,
  });
}
