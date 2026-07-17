import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export type ServiceType =
  | 'transition'
  | 'continuous_a'
  | 'continuous_b'
  | 'other';

export interface PortalShop {
  shopId: string;
  name: string;
  corpId: string | null;
  corpName: string | null;
  businessCategory: string | null;
  status: string | null;
  designated: boolean;
  facilityId: string | null;
  serviceType: ServiceType | null;
  mealsEnabled: boolean;
}

export interface PortalShopsResponse {
  enabled: boolean;
  shops: PortalShop[];
}

export function usePortalShops() {
  return useQuery<PortalShopsResponse>({
    queryKey: ['portal', 'shops'],
    queryFn: async () =>
      (await apiClient.get<PortalShopsResponse>('/portal/shops')).data,
  });
}

export function useDesignateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      shopId: string;
      serviceType?: ServiceType | null;
      mealsEnabled?: boolean;
    }) =>
      apiClient.post(`/portal/shops/${v.shopId}/designate`, {
        serviceType: v.serviceType ?? undefined,
        mealsEnabled: v.mealsEnabled ?? false,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'shops'] });
      // 店舗選択肢など、店舗に依存するものを広く更新
      qc.invalidateQueries({ queryKey: ['users', 'facility-options'] });
    },
  });
}

export function useUndesignateShop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shopId: string) =>
      apiClient.delete(`/portal/shops/${shopId}/designate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portal', 'shops'] });
      qc.invalidateQueries({ queryKey: ['users', 'facility-options'] });
    },
  });
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  transition: '就労移行支援',
  continuous_a: '就労継続支援A型',
  continuous_b: '就労継続支援B型',
  other: 'その他',
};
