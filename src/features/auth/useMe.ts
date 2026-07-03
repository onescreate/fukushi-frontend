import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import type { Me, Permission } from '../../types/me';

/** ログイン中の本人情報（/me）を取得する。 */
export function useMe() {
  return useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<Me>('/me')).data,
    staleTime: 5 * 60 * 1000,
  });
}

/** me が指定の権限を持つか。 */
export function hasPermission(
  me: Me | undefined,
  permission: Permission,
): boolean {
  return !!me?.permissions?.includes(permission);
}
