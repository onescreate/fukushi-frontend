import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface ServiceTypeOption {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export function useServiceTypes() {
  return useQuery<ServiceTypeOption[]>({
    queryKey: ['service-types'],
    queryFn: async () =>
      (await apiClient.get<ServiceTypeOption[]>('/service-types')).data,
  });
}

export function useCreateServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiClient.post<ServiceTypeOption>('/service-types', { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-types'] }),
  });
}

export function useDeleteServiceType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/service-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-types'] }),
  });
}
