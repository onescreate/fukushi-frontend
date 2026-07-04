import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface MealPricing {
  id: string;
  facilityId: string;
  effectiveDate: string; // YYYY-MM-DD
  mealFee: number;
  specialMealFee: number;
  cancelFee: number;
  isCurrent: boolean;
}

export interface MealPricingInput {
  effectiveDate: string;
  mealFee: number;
  specialMealFee: number;
  cancelFee: number;
}

export function useMealPricings(facilityId: string) {
  return useQuery<MealPricing[]>({
    queryKey: ['meal-pricings', facilityId],
    queryFn: async () =>
      (await apiClient.get<MealPricing[]>(`/meal-pricings/${facilityId}`)).data,
    enabled: !!facilityId,
  });
}

export function useCreateMealPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilityId,
      data,
    }: {
      facilityId: string;
      data: MealPricingInput;
    }) => apiClient.post(`/meal-pricings/${facilityId}`, data).then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['meal-pricings', v.facilityId] }),
  });
}

export function useUpdateMealPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilityId,
      id,
      data,
    }: {
      facilityId: string;
      id: string;
      data: MealPricingInput;
    }) =>
      apiClient
        .put(`/meal-pricings/${facilityId}/${id}`, data)
        .then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['meal-pricings', v.facilityId] }),
  });
}

export function useDeleteMealPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, id }: { facilityId: string; id: string }) =>
      apiClient.delete(`/meal-pricings/${facilityId}/${id}`).then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['meal-pricings', v.facilityId] }),
  });
}
