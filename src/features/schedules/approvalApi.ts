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
    mutationFn: ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: 'approve' | 'reject';
      /** 却下の理由（却下のときのみ・任意）。利用者にそのまま表示される。 */
      reason?: string;
    }) =>
      apiClient
        .patch(
          `/schedules/${id}/${decision}`,
          decision === 'reject' ? { reason } : undefined,
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

/** まとめて承認/却下。処理できた件数と、できなかったものを返す。 */
export function useBulkDecideSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      decision,
      reason,
    }: {
      ids: string[];
      decision: 'approve' | 'reject';
      reason?: string;
    }) =>
      apiClient
        .patch<{ done: number; failed: { id: string; message: string }[] }>(
          '/schedules/decide',
          { ids, decision, reason },
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
