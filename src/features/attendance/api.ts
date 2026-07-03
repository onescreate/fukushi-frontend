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
