import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useMe } from '../features/auth/useMe';
import { NAV_ITEMS } from '../app/nav';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

const DESCRIPTIONS: Record<string, string> = {
  '/corporations': '法人の登録・編集',
  '/facilities': '店舗（施設）の登録・編集',
  '/staff': '職員の管理とアカウント発行',
  '/users': '利用者の管理とアカウント発行',
};

export default function DashboardPage() {
  const { data: me } = useMe();

  const quickLinks = NAV_ITEMS.filter(
    (item) =>
      item.to !== '/' &&
      (!item.permission || me?.permissions?.includes(item.permission)),
  );

  return (
    <div>
      <PageHeader
        title={`ようこそ、${me?.name ?? ''} さん`}
        description="管理メニューから操作を選んでください。"
      />

      {quickLinks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="group">
                <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex items-center gap-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {DESCRIPTIONS[item.to] ?? ''}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
