import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

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
  const { data, isLoading, error } = useQuery<Principal>({
    queryKey: ['me'],
    queryFn: async () => (await apiClient.get<Principal>('/me')).data,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <h1 className="font-bold text-slate-800">就労支援 利用者管理システム</h1>
          <button
            onClick={() => logout()}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h2 className="mb-6 text-lg font-semibold text-slate-800">
          ログイン確認（/me）
        </h2>

        {isLoading && <p className="text-slate-500">読み込み中…</p>}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            本人情報の取得に失敗しました。
          </div>
        )}

        {data && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg font-bold text-white">
                {data.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{data.name}</p>
                <p className="text-sm text-slate-500">
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

            <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              ✅ Firebaseログイン → サーバーでトークン検証 → 権限まで解決、が成功しています。
            </p>
          </div>
        )}
      </main>
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
      <dt className="text-slate-400">{label}</dt>
      <dd className={`text-slate-700 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
