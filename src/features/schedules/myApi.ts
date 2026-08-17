import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { Schedule } from './api';

const KEY = ['my-schedules'];
const ALERTS_KEY = ['my-alerts'];

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

export interface MyBreak {
  plannedOut?: string;
  plannedIn?: string;
  /** 用件（例「通院：精神科」）。任意。 */
  note?: string;
}

export function useMySubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      planDate: string;
      planIn?: string;
      planOut?: string;
      note?: string;
      practicePlace?: string;
      breaks?: MyBreak[];
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

/** 予定の一括申請（複数日にまとめて同じ通所時間を登録）。 */
export function useMyBulkSubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      dates: string[];
      planIn?: string;
      planOut?: string;
      note?: string;
    }) =>
      apiClient
        .post<{ approved: number; pending: number }>(
          '/my/schedules/bulk',
          data,
        )
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export type ReasonKind = 'absence' | 'late' | 'early';

export interface MyAlerts {
  /** 差し戻された予定（却下理由つき。理由は任意入力なので null あり） */
  rejected: { date: string; reason: string | null }[];
  reasonNeeded: { date: string; kind: ReasonKind }[];
}

/** 差戻・理由未入力のアラート */
export function useMyAlerts() {
  return useQuery<MyAlerts>({
    queryKey: ALERTS_KEY,
    queryFn: async () =>
      (await apiClient.get<MyAlerts>('/my/attendance/alerts')).data,
  });
}

/** 欠席/遅刻/早退の理由を入力 */
export function useSubmitReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; kind: ReasonKind; reason: string }) =>
      apiClient.post('/my/attendance/reason', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALERTS_KEY });
      qc.invalidateQueries({ queryKey: ['my-attendance'] });
    },
  });
}
