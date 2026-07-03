import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export type TaxCategory = 'standard' | 'reduced';
export type TaxRounding = 'floor' | 'round' | 'ceil';

export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  standard: '標準税率',
  reduced: '軽減税率',
};

export const TAX_ROUNDING_LABELS: Record<TaxRounding, string> = {
  floor: '切り捨て',
  round: '四捨五入',
  ceil: '切り上げ',
};

export interface TaxSetting {
  id: string;
  corporationId: string;
  effectiveDate: string; // YYYY-MM-DD
  category: TaxCategory;
  rate: number;
  priceIncludesTax: boolean;
  rounding: TaxRounding;
  isCurrent: boolean;
}

export interface TaxSettingInput {
  effectiveDate: string;
  category: TaxCategory;
  rate: number;
  priceIncludesTax: boolean;
  rounding: TaxRounding;
}

export function useTaxSettings(corporationId: string) {
  return useQuery<TaxSetting[]>({
    queryKey: ['tax-settings', corporationId],
    queryFn: async () =>
      (await apiClient.get<TaxSetting[]>(`/tax-settings/${corporationId}`)).data,
    enabled: !!corporationId,
  });
}

export function useCreateTaxSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      corporationId,
      data,
    }: {
      corporationId: string;
      data: TaxSettingInput;
    }) =>
      apiClient.post(`/tax-settings/${corporationId}`, data).then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['tax-settings', v.corporationId] }),
  });
}

export function useUpdateTaxSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      corporationId,
      id,
      data,
    }: {
      corporationId: string;
      id: string;
      data: TaxSettingInput;
    }) =>
      apiClient
        .put(`/tax-settings/${corporationId}/${id}`, data)
        .then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['tax-settings', v.corporationId] }),
  });
}

export function useDeleteTaxSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      corporationId,
      id,
    }: {
      corporationId: string;
      id: string;
    }) =>
      apiClient
        .delete(`/tax-settings/${corporationId}/${id}`)
        .then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['tax-settings', v.corporationId] }),
  });
}
