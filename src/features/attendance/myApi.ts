import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface MyAttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  clockIn: string | null;
  clockOut: string | null;
  isLate: boolean;
  isEarlyLeave: boolean;
  absenceReason: string | null;
  lateReason: string | null;
  earlyLeaveReason: string | null;
}

export function useMyAttendance(from: string, to: string) {
  return useQuery<MyAttendanceRecord[]>({
    queryKey: ['my-attendance', from, to],
    queryFn: async () =>
      (
        await apiClient.get<MyAttendanceRecord[]>('/my/attendance', {
          params: { from, to },
        })
      ).data,
  });
}
