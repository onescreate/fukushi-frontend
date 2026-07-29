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

// ---------- 発行者の自動解決（ポータル法人）＋事業所ごとの設定 ----------

export interface ResolvedIssuer {
  issuerName: string | null;
  registrationNumber: string | null;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  bankInfo: string | null;
  sealImage: string | null;
  remark: string | null;
  source: 'portal' | 'legacy' | 'none';
  /** 未設定/一部欠落の理由（プレビュー診断用） */
  reason?: string | null;
  warnings?: string[];
}

/** 請求書に使う発行者情報（ポータル法人＋振込先＋社印＋上書きを解決）。 */
export function useInvoiceIssuer(facilityId: string, date: string) {
  return useQuery<ResolvedIssuer>({
    queryKey: ['invoice-issuer', facilityId, date],
    queryFn: async () =>
      (
        await apiClient.get<ResolvedIssuer>(
          `/invoice-settings/${facilityId}/issuer`,
          { params: { date } },
        )
      ).data,
    enabled: !!facilityId && !!date,
  });
}

export interface InvoiceConfig {
  facilityId: string;
  bankAccountId: string | null;
  sealEnabled: boolean;
  issuerNameOverride: string | null;
  registrationNumberOverride: string | null;
  postalCodeOverride: string | null;
  addressOverride: string | null;
  phoneOverride: string | null;
  bankInfoOverride: string | null;
  remark: string | null;
}

export interface CorpAccount {
  id: string;
  label: string;
  name: string | null;
}

export function useInvoiceConfig(facilityId: string) {
  return useQuery<InvoiceConfig>({
    queryKey: ['invoice-config', facilityId],
    queryFn: async () =>
      (await apiClient.get<InvoiceConfig>(`/invoice-settings/${facilityId}/config`)).data,
    enabled: !!facilityId,
  });
}

export interface CorpAccountsResult {
  enabled: boolean;
  linked?: boolean;
  error?: boolean;
  accounts: CorpAccount[];
}

export function useCorpAccounts(facilityId: string) {
  return useQuery<CorpAccountsResult>({
    queryKey: ['invoice-accounts', facilityId],
    queryFn: async () =>
      (
        await apiClient.get<CorpAccountsResult>(
          `/invoice-settings/${facilityId}/accounts`,
        )
      ).data,
    enabled: !!facilityId,
  });
}

export function useSaveInvoiceConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilityId,
      data,
    }: {
      facilityId: string;
      data: Partial<Omit<InvoiceConfig, 'facilityId'>>;
    }) => apiClient.put(`/invoice-settings/${facilityId}/config`, data).then((r) => r.data),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['invoice-config', v.facilityId] });
      qc.invalidateQueries({ queryKey: ['invoice-issuer', v.facilityId] });
    },
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
