import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface MyHealthStatus {
  year: number;
  month: number;
  recorded: boolean;
  weightKg: number | null;
}

export function useMyHealth() {
  return useQuery<MyHealthStatus>({
    queryKey: ['my', 'health'],
    queryFn: async () =>
      (await apiClient.get<MyHealthStatus>('/my/health')).data,
  });
}

export function useSubmitMyHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weightKg: number) =>
      apiClient.post('/my/health', { weightKg }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my', 'health'] }),
  });
}
