import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export type AnnouncementAudience = 'users' | 'staff' | 'all';

export const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  users: '利用者向け',
  staff: '職員向け',
  all: '利用者・職員',
};

export interface Announcement {
  id: string;
  facilityId: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishedOn: string; // YYYY-MM-DD
}

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishedOn: string;
}

// ---------- 管理 ----------

export function useAnnouncements(facilityId: string) {
  return useQuery<Announcement[]>({
    queryKey: ['announcements', facilityId],
    queryFn: async () =>
      (await apiClient.get<Announcement[]>(`/announcements/${facilityId}`)).data,
    enabled: !!facilityId,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, data }: { facilityId: string; data: AnnouncementInput }) =>
      apiClient.post(`/announcements/${facilityId}`, data).then((r) => r.data),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['announcements', v.facilityId] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilityId,
      id,
      data,
    }: {
      facilityId: string;
      id: string;
      data: AnnouncementInput;
    }) => apiClient.put(`/announcements/${facilityId}/${id}`, data).then((r) => r.data),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['announcements', v.facilityId] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, id }: { facilityId: string; id: string }) =>
      apiClient.delete(`/announcements/${facilityId}/${id}`).then((r) => r.data),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['announcements', v.facilityId] }),
  });
}

// ---------- フィード ----------

/** 職員向けフィード（ダッシュボード用） */
export function useStaffAnnouncements(facilityId: string) {
  return useQuery<Announcement[]>({
    queryKey: ['announcements', 'feed', facilityId],
    queryFn: async () =>
      (await apiClient.get<Announcement[]>(`/announcements/${facilityId}/feed`)).data,
    enabled: !!facilityId,
  });
}

/** 利用者向けフィード（個人ページ用） */
export function useMyAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['my-announcements'],
    queryFn: async () =>
      (await apiClient.get<Announcement[]>('/my/announcements')).data,
  });
}
