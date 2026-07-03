import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useUsersFacilityOptions } from '../features/users/api';
import {
  useMealPricings,
  useDeleteMealPricing,
  type MealPricing,
} from '../features/meals/api';
import { MealPricingFormDialog } from '../features/meals/MealPricingFormDialog';
import { hasPermission, useMe } from '../features/auth/useMe';
import { formatDate } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

export default function MealPricingPage() {
  const { data: me } = useMe();
  const canManage = hasPermission(me, 'settings.price');
  const { data: facilities } = useUsersFacilityOptions();
  const [facilityId, setFacilityId] = useState('');

  const { data: pricings, isLoading } = useMealPricings(facilityId);
  const del = useDeleteMealPricing();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MealPricing | null>(null);
  const [deleting, setDeleting] = useState<MealPricing | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: MealPricing) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync({ facilityId, id: deleting.id });
      toast.success('食事料金を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="食事料金"
        description="食事料金・キャンセル料を店舗ごとに設定します。適用開始日つきで履歴管理し、利用日時点の料金を請求に使います。"
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="w-64">
          <Select
            items={Object.fromEntries(
              (facilities ?? []).map((f) => [f.id, f.name]),
            )}
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
        {facilityId && canManage && (
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 size-4" />
            料金を追加
          </Button>
        )}
      </div>

      {facilityId && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>適用開始日</TableHead>
                <TableHead className="text-right">食事料金</TableHead>
                <TableHead className="text-right">キャンセル料</TableHead>
                <TableHead>状態</TableHead>
                {canManage && <TableHead className="w-24 text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : (pricings ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    料金がまだ登録されていません。
                  </TableCell>
                </TableRow>
              ) : (
                (pricings ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.effectiveDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {yen(row.mealFee)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {yen(row.cancelFee)}
                    </TableCell>
                    <TableCell>
                      {row.isCurrent ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          適用中
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(row)}
                            aria-label="編集"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(row)}
                            aria-label="削除"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <MealPricingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        facilityId={facilityId}
        target={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="食事料金を削除しますか？"
        description={`適用開始日「${
          deleting ? formatDate(deleting.effectiveDate) : ''
        }」の料金を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
