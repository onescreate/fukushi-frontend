import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface KioskDevice {
  id: string;
  label: string;
  facilityId: string;
  status: 'active' | 'inactive';
  lastUsedAt: string | null;
  createdAt: string;
  facility?: { name: string };
}

export interface CreateDeviceResult {
  device: { id: string; label: string; facilityId: string; status: string };
  token: string;
}

const KEY = ['kiosk-devices'];

export function useDevices() {
  return useQuery<KioskDevice[]>({
    queryKey: KEY,
    queryFn: async () =>
      (await apiClient.get<KioskDevice[]>('/kiosk-devices')).data,
  });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { facilityId: string; label: string }) =>
      apiClient
        .post<CreateDeviceResult>('/kiosk-devices', data)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/kiosk-devices/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
