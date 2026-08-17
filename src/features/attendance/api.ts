import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface AttendanceSettings {
  facilityId: string;
  lateGraceMinutes: number;
  earlyLeaveGraceMinutes: number;
}

export function useAttendanceSettings(facilityId: string) {
  return useQuery<AttendanceSettings>({
    queryKey: ['attendance-settings', facilityId],
    queryFn: async () =>
      (await apiClient.get<AttendanceSettings>(`/attendance-settings/${facilityId}`))
        .data,
    enabled: !!facilityId,
  });
}

export interface RosterBreak {
  plannedOut: string | null;
  plannedIn: string | null;
  note: string | null;
}

export interface RosterRow {
  userId: string;
  name: string;
  facilityName: string | null;
  planIn: string | null;
  planOut: string | null;
  scheduleStatus: 'pending' | 'approved' | 'rejected' | null;
  /** 実習先（実習日のみ。null=通常の通所） */
  practicePlace: string | null;
  breaks: RosterBreak[];
  clockIn: string | null;
  clockOut: string | null;
  status: 'present' | 'absent' | 'notyet';
  isLate: boolean;
  isEarlyLeave: boolean;
  absenceReason: string | null;
  lateReason: string | null;
  earlyLeaveReason: string | null;
  /** 管理者が手で補正した日時（ISO文字列）。null=打刻そのまま。 */
  manualEditedAt: string | null;
  /** 補正した職員の氏名。 */
  manualEditedByName: string | null;
  meal: { status: 'reserved' | 'eaten' } | null;
}

export function useRoster(facilityId: string, date: string) {
  return useQuery<RosterRow[]>({
    queryKey: ['roster', facilityId, date],
    queryFn: async () =>
      (
        await apiClient.get<RosterRow[]>('/attendance/roster', {
          params: { facilityId, date },
        })
      ).data,
    enabled: !!facilityId && !!date,
  });
}

export interface ManualAttendanceInput {
  userId: string;
  date: string;
  status?: 'present' | 'absent';
  clockIn?: string;
  clockOut?: string;
  absenceReason?: string;
  lateReason?: string;
  earlyLeaveReason?: string;
}

export function useManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ManualAttendanceInput) =>
      apiClient.patch('/attendance/manual', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roster'] });
      qc.invalidateQueries({ queryKey: ['attendance-list'] });
    },
  });
}

export interface AttendanceListRow {
  key: string;
  userId: string;
  userName: string;
  facilityName: string | null;
  date: string;
  planIn: string | null;
  planOut: string | null;
  actIn: string | null;
  actOut: string | null;
  status: 'present' | 'absent' | 'notyet';
  reason: string | null;
  /** 実習先（実習日のみ。null=通常の通所） */
  practicePlace: string | null;
  /** 中抜け（外出→戻り・用件つき） */
  breaks: RosterBreak[];
  /** 管理者が手で補正した日時（ISO文字列）。null=打刻そのまま。 */
  manualEditedAt: string | null;
  /** 補正した職員の氏名。 */
  manualEditedByName: string | null;
}

export interface AttendanceListData {
  year: number;
  month: number;
  allMode: boolean;
  rows: AttendanceListRow[];
}

export function useAttendanceList(
  facilityId: string,
  year: number,
  month: number,
) {
  return useQuery<AttendanceListData>({
    queryKey: ['attendance-list', facilityId, year, month],
    queryFn: async () =>
      (
        await apiClient.get<AttendanceListData>('/attendance/list', {
          params: { facilityId, year, month },
        })
      ).data,
    enabled: !!facilityId,
  });
}

export function useUpdateAttendanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilityId,
      lateGraceMinutes,
      earlyLeaveGraceMinutes,
    }: AttendanceSettings) =>
      apiClient
        .put(`/attendance-settings/${facilityId}`, {
          lateGraceMinutes,
          earlyLeaveGraceMinutes,
        })
        .then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ['attendance-settings', v.facilityId],
      }),
  });
}
