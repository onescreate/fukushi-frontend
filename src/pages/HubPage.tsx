import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useMe } from '../features/auth/useMe';
import { PageHeader } from '../components/layout/PageHeader';
import type { NavItem } from '../app/nav';

const DESCRIPTIONS: Record<string, string> = {
  '/users': '利用者の登録・アカウント発行（PIN／自宅ログイン）',
  '/devices': '打刻用タブレット端末の登録・削除',
  '/attendance-settings': '遅刻・早退判定の猶予時間（店舗ごと）',
  '/meal-pricing': '食事料金・キャンセル料（店舗ごと・適用開始日つき）',
  '/tax-settings': '消費税（法人ごと・標準/軽減）',
  '/invoice-settings': '適格請求書の発行者情報（店舗ごと）',
};

/** マスタ管理・設定などのハブ画面。子項目をカードで並べる。 */
export function HubPage({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: NavItem[];
}) {
  const { data: me } = useMe();
  const visible = items.filter(
    (it) => !it.permission || me?.permissions?.includes(it.permission),
  );

  return (
    <div>
      <PageHeader title={title} description={description} />
      {visible.length === 0 ? (
        <p className="text-[13px] font-medium text-slate-400">
          利用できる項目がありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className="group rounded-xl border border-[#ECEDF1] bg-white p-4 shadow-[0_1px_2px_rgba(20,20,28,.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-slate-800">
                      {it.label}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] font-medium text-slate-400">
                      {DESCRIPTIONS[it.to] ?? ''}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
