import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronRight as Arrow } from 'lucide-react';
import { useMe, hasPermission } from '../features/auth/useMe';
import { NAV_ITEMS } from '../app/nav';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsersFacilityOptions } from '../features/users/api';
import { useFacilityStats } from '../features/stats/api';
import { useStaffAnnouncements } from '../features/announcements/api';
import { formatDate } from '../lib/format';

const DESCRIPTIONS: Record<string, string> = {
  '/corporations': '法人の登録・編集',
  '/facilities': '店舗（施設）の登録・編集',
  '/staff': '職員の管理とアカウント発行',
  '/users': '利用者の管理とアカウント発行',
};

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

function Tile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="px-4 py-3.5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ?? 'text-foreground'}`}>
          {value}
        </p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

function StatsPanel() {
  const { data: facilities } = useUsersFacilityOptions();
  const [facilityId, setFacilityId] = useState('');
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // 初期店舗を選択
  useEffect(() => {
    if (!facilityId && facilities && facilities.length > 0) {
      setFacilityId(facilities[0].id);
    }
  }, [facilities, facilityId]);

  const { data } = useFacilityStats(facilityId, year, month);
  const { data: notices } = useStaffAnnouncements(facilityId);

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    else if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const att = data?.attendance;
  const rate = att?.rate ?? null;

  return (
    <div className="mb-8 space-y-5">
      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            items={Object.fromEntries((facilities ?? []).map((f) => [f.id, f.name]))}
            value={facilityId || null}
            onValueChange={(v) => setFacilityId((v as string) ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="店舗を選択" />
            </SelectTrigger>
            <SelectContent>
              {(facilities ?? []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-24 text-center text-sm font-semibold">
            {year}年 {month}月
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {!facilityId ? null : (
        <>
          {/* お知らせ（職員向け） */}
          {(notices ?? []).length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">お知らせ</p>
              <div className="space-y-2">
                {(notices ?? []).slice(0, 5).map((n) => (
                  <Card key={n.id} className="p-3.5">
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(n.publishedOn)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {n.body}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 通所 */}
          <Section title="通所">
            <Card className="col-span-2">
              <CardContent className="px-4 py-3.5">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-medium text-muted-foreground">通所率</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {rate === null ? '—' : `${rate}%`}
                  </p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${rate ?? 0}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  出席 {att?.present ?? 0} / 予定 {att?.planned ?? 0}
                </p>
              </CardContent>
            </Card>
            <Tile label="欠席" value={att?.absent ?? 0} sub="件" />
            <Tile label="遅刻 / 早退" value={`${att?.late ?? 0} / ${att?.earlyLeave ?? 0}`} sub="件" />
          </Section>

          {/* 食事 */}
          <Section title="食事">
            <Tile label="予約中" value={data?.meals.reserved ?? 0} sub="食" />
            <Tile label="喫食済" value={data?.meals.eaten ?? 0} sub="食" />
            <Tile label="キャンセル" value={data?.meals.cancelled ?? 0} sub="件" />
            <Tile label="提供予定（発注）" value={data?.meals.ordered ?? 0} sub="食" />
          </Section>

          {/* 請求（権限がある場合のみ返る） */}
          {data?.billing && (
            <Section title={`請求${data.billing.closed ? '（締め済み）' : ''}`}>
              <Tile label="請求額" value={yen(data.billing.total)} />
              <Tile
                label="入金済み"
                value={yen(data.billing.paidAmount)}
                sub={`${data.billing.paidCount}件`}
                accent="text-emerald-600"
              />
              <Tile
                label="未入金"
                value={yen(data.billing.unpaidAmount)}
                sub={`${data.billing.unpaidCount}件`}
                accent={data.billing.unpaidAmount > 0 ? 'text-rose-600' : undefined}
              />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data: me } = useMe();
  const showStats = hasPermission(me, 'attendance.view');

  const quickLinks = NAV_ITEMS.filter(
    (item) =>
      item.to !== '/' &&
      (!item.permission || me?.permissions?.includes(item.permission)),
  );

  return (
    <div>
      <PageHeader
        title={`ようこそ、${me?.name ?? ''} さん`}
        description="当月の状況と、管理メニューを確認できます。"
      />

      {showStats && <StatsPanel />}

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
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {DESCRIPTIONS[item.to] ?? ''}
                      </p>
                    </div>
                    <Arrow className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
