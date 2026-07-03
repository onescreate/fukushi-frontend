import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export type ServiceType =
  | 'transition'
  | 'continuous_a'
  | 'continuous_b'
  | 'other';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  transition: '就労移行支援',
  continuous_a: '就労継続支援A型',
  continuous_b: '就労継続支援B型',
  other: 'その他',
};

export interface Facility {
  id: string;
  corporationId: string;
  name: string;
  serviceType: ServiceType | null;
  mealsEnabled: boolean;
  mealChangeDeadlineDays: number;
  email: string | null;
  status: 'active' | 'inactive';
  remarks: string | null;
  establishedOn: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  phone: string | null;
  createdAt: string;
  corporation?: { name: string };
  _count?: { users: number };
}

export interface CreateFacilityInput {
  corporationId: string;
  name: string;
  serviceType?: ServiceType;
  mealsEnabled?: boolean;
  mealChangeDeadlineDays?: number;
  email?: string;
  remarks?: string;
  status?: 'active' | 'inactive';
  establishedOn?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  addressLine?: string;
  phone?: string;
}

export type UpdateFacilityInput = Omit<CreateFacilityInput, 'corporationId'>;

const KEY = ['facilities'];

export function useFacilities() {
  return useQuery<Facility[]>({
    queryKey: KEY,
    queryFn: async () => (await apiClient.get<Facility[]>('/facilities')).data,
  });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacilityInput) =>
      apiClient.post<Facility>('/facilities', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFacilityInput }) =>
      apiClient.patch<Facility>(`/facilities/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/facilities/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
