import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface Corporation {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  establishedOn: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { facilities: number; users: number; staff: number };
}

export interface CorporationInput {
  name: string;
  status?: 'active' | 'inactive';
  establishedOn?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  phone?: string;
}

const KEY = ['corporations'];

export function useCorporations(enabled = true) {
  return useQuery<Corporation[]>({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get<Corporation[]>('/corporations')).data,
    enabled,
  });
}

export function useCreateCorporation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CorporationInput) =>
      apiClient.post<Corporation>('/corporations', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCorporation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CorporationInput }) =>
      apiClient
        .patch<Corporation>(`/corporations/${id}`, data)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCorporation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/corporations/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
