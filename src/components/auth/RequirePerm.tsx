import type { ReactNode } from 'react';
import { useMe } from '../../features/auth/useMe';
import type { Permission } from '../../types/me';

/** 指定の権限が無ければアクセス不可を表示する（画面単位のガード）。 */
export function RequirePerm({
  perm,
  children,
}: {
  perm: Permission;
  children: ReactNode;
}) {
  const { data: me, isLoading } = useMe();

  if (isLoading) {
    return <p className="text-muted-foreground">読み込み中…</p>;
  }
  if (!me || !me.permissions.includes(perm)) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        この画面を表示する権限がありません。
      </div>
    );
  }
  return <>{children}</>;
}
