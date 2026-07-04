import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface HealthRow {
  userId: string;
  userName: string;
  facilityName: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  measuredOn: string | null;
  note: string | null;
}

export interface HealthList {
  year: number;
  month: number;
  allMode: boolean;
  rows: HealthRow[];
}

export interface HealthInput {
  weightKg?: number;
  heightCm?: number;
  measuredOn?: string;
  note?: string;
}

export function useHealthRecords(
  facilityId: string,
  year: number,
  month: number,
) {
  return useQuery<HealthList>({
    queryKey: ['health-records', facilityId, year, month],
    queryFn: async () =>
      (
        await apiClient.get<HealthList>('/health-records', {
          params: { facilityId, year, month },
        })
      ).data,
    enabled: !!facilityId,
  });
}

export function useUpsertHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      year,
      month,
      data,
    }: {
      userId: string;
      year: number;
      month: number;
      data: HealthInput;
    }) =>
      apiClient
        .post(`/health-records/${userId}`, data, { params: { year, month } })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-records'] });
      qc.invalidateQueries({ queryKey: ['health-missing'] });
    },
  });
}

export function useHealthMissingCount(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: ['health-missing'],
    queryFn: async () =>
      (await apiClient.get<{ count: number }>('/health-records/missing-count')).data,
    enabled,
    refetchInterval: 60_000,
  });
}
