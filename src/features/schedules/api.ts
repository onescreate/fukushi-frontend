import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface ScheduleDetail {
  id: string;
  eventType: 'break_out' | 'practice' | 'other';
  plannedOut: string | null;
  plannedIn: string | null;
  actualOut: string | null;
  actualIn: string | null;
  note: string | null;
}

export interface Schedule {
  id: string;
  userId: string;
  planDate: string; // ISO
  planIn: string | null;
  planOut: string | null;
  status: 'pending' | 'approved' | 'rejected';
  note: string | null;
  /** 却下された理由（承認画面で入力されたもの）。承認・申請中は null。 */
  rejectReason?: string | null;
  details?: ScheduleDetail[];
}

/** 予定に紐づく「実習先」を取り出す（実習日でなければ null）。 */
export function practicePlaceOf(schedule?: Schedule | null): string | null {
  return (
    (schedule?.details ?? []).find((d) => d.eventType === 'practice')?.note ??
    null
  );
}

/** 予定に紐づく中抜け（外出→戻り）の一覧。 */
export function breaksOf(schedule?: Schedule | null): ScheduleDetail[] {
  return (schedule?.details ?? []).filter((d) => d.eventType === 'break_out');
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
      /** 実習先（値あり=実習日／空文字=通所日に戻す） */
      practicePlace?: string;
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
      data: {
        planIn?: string;
        planOut?: string;
        note?: string;
        /** 実習先（値あり=実習日／空文字=通所日に戻す） */
        practicePlace?: string;
      };
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

export function useAddScheduleDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scheduleId,
      plannedOut,
      plannedIn,
      note,
    }: {
      scheduleId: string;
      plannedOut?: string;
      plannedIn?: string;
      note?: string;
    }) =>
      apiClient
        .post<ScheduleDetail>(`/schedules/${scheduleId}/details`, {
          eventType: 'break_out',
          plannedOut,
          plannedIn,
          note,
        })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRemoveScheduleDetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (detailId: string) =>
      apiClient.delete(`/schedules/details/${detailId}`).then((r) => r.data),
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
