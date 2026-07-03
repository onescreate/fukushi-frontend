import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsersFacilityOptions, useUsersList } from '../features/users/api';
import {
  MEAL_STATUS_LABELS,
  useMealReservations,
  type MealWithUser,
} from '../features/meals/reservationApi';
import { MealAdminDialog } from '../features/meals/MealAdminDialog';
import { hasPermission, useMe } from '../features/auth/useMe';
import { formatDate } from '../lib/format';

const pad = (n: number) => String(n).padStart(2, '0');
const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

function approvalBadge(m: MealWithUser) {
  if (m.approvalStatus === 'pending') {
    return { text: m.requestType === 'cancel' ? '取消申請中' : '予約申請中', cls: 'bg-amber-100 text-amber-700' };
  }
  if (m.approvalStatus === 'rejected') return { text: '却下', cls: 'bg-slate-100 text-slate-500' };
  return { text: '承認済', cls: 'bg-emerald-100 text-emerald-700' };
}

export default function MealReservationsPage() {
  const { data: me } = useMe();
  const canManage = hasPermission(me, 'meal.manage');
  const { data: facilities } = useUsersFacilityOptions();
  const { data: allUsers } = useUsersList();
  const [facilityId, setFacilityId] = useState('');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const daysInMonth = new Date(year, month, 0).getDate();
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;

  const { data: meals, isLoading } = useMealReservations(facilityId, from, to);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MealWithUser | null>(null);

  const facilityUsers = useMemo(
    () =>
      (allUsers ?? [])
        .filter((u) => u.facilityId === facilityId)
        .map((u) => ({ id: u.id, name: `${u.lastName} ${u.firstName}` })),
    [allUsers, facilityId],
  );

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    else if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div>
      <PageHeader
        title="食事予約"
        description="店舗ごとの食事予約を確認・登録します。管理側の登録は締切・承認なしで即時反映されます。"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
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

        {facilityId && canManage && (
          <Button
            className="ml-auto"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            予約を追加
          </Button>
        )}
      </div>

      {facilityId && (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>利用日</TableHead>
                <TableHead>利用者</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>承認</TableHead>
                <TableHead className="text-right">金額</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : (meals ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    この月の食事予約はありません。
                  </TableCell>
                </TableRow>
              ) : (
                (meals ?? []).map((m) => {
                  const badge = approvalBadge(m);
                  return (
                    <TableRow
                      key={m.id}
                      className={canManage ? 'cursor-pointer' : ''}
                      onClick={
                        canManage
                          ? () => {
                              setEditing(m);
                              setDialogOpen(true);
                            }
                          : undefined
                      }
                    >
                      <TableCell>{formatDate(m.mealDate)}</TableCell>
                      <TableCell className="font-medium text-foreground">{m.userName}</TableCell>
                      <TableCell>{MEAL_STATUS_LABELS[m.status]}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}>
                          {badge.text}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{yen(m.amount)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <MealAdminDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        users={facilityUsers}
        target={editing}
      />
    </div>
  );
}
