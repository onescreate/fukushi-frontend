import { useEffect, useState } from 'react';
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
import { useCorporations } from '../features/corporations/api';
import {
  TAX_CATEGORY_LABELS,
  TAX_ROUNDING_LABELS,
  useTaxSettings,
  useDeleteTaxSetting,
  type TaxSetting,
} from '../features/meals/taxApi';
import { TaxSettingFormDialog } from '../features/meals/TaxSettingFormDialog';
import { hasPermission, useMe } from '../features/auth/useMe';
import { formatDate } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

export default function TaxSettingsPage() {
  const { data: me } = useMe();
  const canChooseCorp = hasPermission(me, 'corporation.manage');
  const { data: corporations } = useCorporations(canChooseCorp);
  const [corporationId, setCorporationId] = useState('');

  // 法人を選べないユーザーは自法人に固定
  useEffect(() => {
    if (!canChooseCorp && me?.corporationId) setCorporationId(me.corporationId);
  }, [canChooseCorp, me?.corporationId]);

  const { data: settings, isLoading } = useTaxSettings(corporationId);
  const del = useDeleteTaxSetting();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaxSetting | null>(null);
  const [deleting, setDeleting] = useState<TaxSetting | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row: TaxSetting) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync({ corporationId, id: deleting.id });
      toast.success('消費税設定を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="消費税設定"
        description="消費税を法人ごと・区分（標準/軽減）ごとに設定します。適用開始日つきで履歴管理し、利用日時点の設定を請求に使います。"
      />

      <div className="mb-4 flex items-center justify-between gap-4">
        {canChooseCorp && (
          <div className="w-64">
            <Select
              items={Object.fromEntries(
                (corporations ?? []).map((c) => [c.id, c.name]),
              )}
              value={corporationId || null}
              onValueChange={(v) => setCorporationId((v as string) ?? '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="法人を選択" />
              </SelectTrigger>
              <SelectContent>
                {(corporations ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {corporationId && (
          <Button onClick={openCreate} className={canChooseCorp ? '' : 'ml-auto'}>
            <Plus className="mr-1.5 size-4" />
            設定を追加
          </Button>
        )}
      </div>

      {corporationId && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>適用開始日</TableHead>
                <TableHead>区分</TableHead>
                <TableHead className="text-right">税率</TableHead>
                <TableHead>税の扱い</TableHead>
                <TableHead>端数</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : (settings ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    消費税設定がまだ登録されていません。
                  </TableCell>
                </TableRow>
              ) : (
                (settings ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.effectiveDate)}</TableCell>
                    <TableCell>{TAX_CATEGORY_LABELS[row.category]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.rate}%
                    </TableCell>
                    <TableCell>{row.priceIncludesTax ? '内税' : '外税'}</TableCell>
                    <TableCell>{TAX_ROUNDING_LABELS[row.rounding]}</TableCell>
                    <TableCell>
                      {row.isCurrent ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          適用中
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <TaxSettingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        corporationId={corporationId}
        target={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="消費税設定を削除しますか？"
        description={`「${
          deleting ? TAX_CATEGORY_LABELS[deleting.category] : ''
        }・${
          deleting ? formatDate(deleting.effectiveDate) : ''
        }」の設定を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
