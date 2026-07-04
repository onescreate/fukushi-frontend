import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export interface InvoiceSetting {
  id: string;
  facilityId: string;
  effectiveDate: string;
  issuerName: string;
  registrationNumber: string | null;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  bankInfo: string | null;
  isCurrent: boolean;
}

export interface InvoiceSettingInput {
  effectiveDate: string;
  issuerName: string;
  registrationNumber?: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  bankInfo?: string;
}

export function useInvoiceSettings(facilityId: string) {
  return useQuery<InvoiceSetting[]>({
    queryKey: ['invoice-settings', facilityId],
    queryFn: async () =>
      (await apiClient.get<InvoiceSetting[]>(`/invoice-settings/${facilityId}`)).data,
    enabled: !!facilityId,
  });
}

/** 指定日に有効な発行者情報（請求書描画用）。 */
export function useActiveInvoiceSetting(facilityId: string, date: string) {
  return useQuery<InvoiceSetting | null>({
    queryKey: ['invoice-settings', 'active', facilityId, date],
    queryFn: async () =>
      (
        await apiClient.get<InvoiceSetting | null>(
          `/invoice-settings/${facilityId}/active`,
          { params: { date } },
        )
      ).data,
    enabled: !!facilityId && !!date,
  });
}

export function useCreateInvoiceSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, data }: { facilityId: string; data: InvoiceSettingInput }) =>
      apiClient.post(`/invoice-settings/${facilityId}`, data).then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['invoice-settings', v.facilityId] }),
  });
}

export function useUpdateInvoiceSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilityId,
      id,
      data,
    }: {
      facilityId: string;
      id: string;
      data: InvoiceSettingInput;
    }) =>
      apiClient.put(`/invoice-settings/${facilityId}/${id}`, data).then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['invoice-settings', v.facilityId] }),
  });
}

export function useDeleteInvoiceSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityId, id }: { facilityId: string; id: string }) =>
      apiClient.delete(`/invoice-settings/${facilityId}/${id}`).then((r) => r.data),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['invoice-settings', v.facilityId] }),
  });
}
