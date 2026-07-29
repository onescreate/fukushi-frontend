import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface ClosingRow {
  userId: string;
  userName: string;
  facilityName: string | null;
  planIn: string | null;
  planOut: string | null;
  actIn: string | null;
  actOut: string | null;
  isAbsent: boolean;
  /** 通所予定なしで打刻あり（参考表示） */
  noSchedule: boolean;
  mealProvided: boolean;
  regionalCooperation: boolean;
  transitionPrep: boolean;
  absenceHandling: boolean;
}

export interface ClosingList {
  date: string;
  allMode: boolean;
  rows: ClosingRow[];
  /** 当日通所人数（実際に打刻した人数） */
  attendeeCount: number;
}

export type ClosingFlag =
  | 'regionalCooperation'
  | 'transitionPrep'
  | 'absenceHandling';

export function useClosingOperations(facilityId: string, date: string) {
  return useQuery<ClosingList>({
    queryKey: ['closing-operations', facilityId, date],
    queryFn: async () =>
      (
        await apiClient.get<ClosingList>('/closing-operations', {
          params: { facilityId, date },
        })
      ).data,
    enabled: !!facilityId && !!date,
  });
}

export function useSaveClosingOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      date,
      data,
    }: {
      userId: string;
      date: string;
      data: {
        regionalCooperation: boolean;
        transitionPrep: boolean;
        absenceHandling: boolean;
      };
    }) =>
      apiClient
        .post(`/closing-operations/${userId}`, data, { params: { date } })
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['closing-operations'] }),
  });
}
