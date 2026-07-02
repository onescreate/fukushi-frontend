import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface FacilityRole {
  facilityId: string | null;
  role: string;
}

interface Principal {
  type: 'staff' | 'user';
  id: string;
  name: string;
  email?: string;
  loginId?: string;
  corporationId: string;
  facilityId?: string;
  roles?: FacilityRole[];
}

const ROLE_LABEL: Record<string, string> = {
  system_admin: 'システム管理者',
  corporation_admin: '法人管理者',
  facility_admin: '店舗管理者',
  staff: 'スタッフ',
};

export default function HomePage() {
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading, error } = useQuery<Principal>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<Principal>('/me')).data,
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="font-bold text-foreground">就労支援 利用者管理システム</h1>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            ログアウト
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        {isLoading && <p className="text-muted-foreground">読み込み中…</p>}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            本人情報の取得に失敗しました。
          </div>
        )}

        {data && (
          <Card>
            <CardHeader>
              <CardTitle>ログイン中のアカウント</CardTitle>
              <CardDescription>/me の応答（サーバーが解決した本人情報）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {data.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{data.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.email ?? data.loginId}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <Row label="種別" value={data.type === 'staff' ? '職員' : '利用者'} />
                <Row label="法人ID" value={data.corporationId} mono />
                {data.roles && (
                  <Row
                    label="権限"
                    value={data.roles
                      .map(
                        (r) =>
                          `${ROLE_LABEL[r.role] ?? r.role}${
                            r.facilityId ? '（店舗限定）' : '（法人全体）'
                          }`,
                      )
                      .join(' / ')}
                  />
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* 共通UIキットの動作確認（確認ダイアログ＋トースト） */}
        <Card>
          <CardHeader>
            <CardTitle>共通UI部品の確認</CardTitle>
            <CardDescription>
              ネイティブの alert / confirm は使わず、統一デザインの部品を使います。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => toast.success('トースト通知の例です')}>
              トーストを表示
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              確認ダイアログを開く
            </Button>
          </CardContent>
        </Card>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="この操作を実行しますか？"
        description="これは共通確認ダイアログのサンプルです。実行するとトーストが表示されます。"
        confirmLabel="実行する"
        destructive
        onConfirm={() => {
          toast.success('確認ダイアログから実行しました');
        }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-foreground ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
