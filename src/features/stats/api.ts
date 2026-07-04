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
