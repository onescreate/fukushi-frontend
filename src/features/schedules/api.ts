import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface Schedule {
  id: string;
  userId: string;
  planDate: string; // ISO
  planIn: string | null;
  planOut: string | null;
  status: 'pending' | 'approved' | 'rejected';
  note: string | null;
}

const KEY = ['schedules'];

export function useSchedules(userId: string, from: string, to: string) {
  return useQuery<Schedule[]>({
    queryKey: [...KEY, userId, from, to],
    queryFn: async () =>
      (
        await apiClient.get<Schedule[]>('/schedules', {
          params: { userId, from, to },
        })
      ).data,
    enabled: !!userId,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      planDate: string;
      planIn?: string;
      planOut?: string;
      note?: string;
    }) => apiClient.post('/schedules', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { planIn?: string; planOut?: string; note?: string };
    }) => apiClient.patch(`/schedules/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/schedules/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBulkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userId: string;
      dates: string[];
      planIn?: string;
      planOut?: string;
    }) =>
      apiClient
        .post<{ created: number; skipped: number }>('/schedules/bulk', data)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
