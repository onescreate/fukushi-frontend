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
  planIn: string | null;
  planOut: string | null;
  scheduleStatus: 'pending' | 'approved' | 'rejected' | null;
  breaks: RosterBreak[];
  clockIn: string | null;
  clockOut: string | null;
  status: 'present' | 'absent' | 'notyet';
  isLate: boolean;
  isEarlyLeave: boolean;
  absenceReason: string | null;
  lateReason: string | null;
  earlyLeaveReason: string | null;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roster'] }),
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
