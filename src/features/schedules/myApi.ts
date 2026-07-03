import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { Schedule } from './api';

const KEY = ['my-schedules'];

export function useMySchedules(from: string, to: string) {
  return useQuery<Schedule[]>({
    queryKey: [...KEY, from, to],
    queryFn: async () =>
      (
        await apiClient.get<Schedule[]>('/my/schedules', {
          params: { from, to },
        })
      ).data,
  });
}

export function useMySubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      planDate: string;
      planIn?: string;
      planOut?: string;
      note?: string;
    }) =>
      apiClient
        .post<{ schedule: Schedule; autoApproved: boolean }>(
          '/my/schedules',
          data,
        )
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
