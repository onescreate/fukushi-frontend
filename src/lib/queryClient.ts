import { QueryClient } from '@tanstack/react-query';

// サーバー状態の取得・キャッシュを一元管理する（既存の「全部useState」を廃止）
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
