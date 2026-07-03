import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { Schedule } from './api';

export interface PendingSchedule extends Schedule {
  user: { lastName: string; firstName: string };
}

const KEY = ['schedules', 'pending'];

export function usePendingSchedules(enabled = true) {
  return useQuery<PendingSchedule[]>({
    queryKey: KEY,
    queryFn: async () =>
      (await apiClient.get<PendingSchedule[]>('/schedules/pending')).data,
    enabled,
  });
}

export function usePendingCount(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: [...KEY, 'count'],
    queryFn: async () =>
      (await apiClient.get<{ count: number }>('/schedules/pending/count')).data,
    enabled,
    refetchInterval: 60_000,
  });
}

export function useDecideSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) =>
      apiClient.patch(`/schedules/${id}/${decision}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
}
