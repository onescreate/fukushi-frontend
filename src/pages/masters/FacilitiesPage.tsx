import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DetailDialog } from '@/components/DetailDialog';
import { formatAddress, formatDate } from '../../lib/format';
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
import { hasPermission, useMe } from '../../features/auth/useMe';
import {
  SERVICE_TYPE_LABELS,
  useDeleteFacility,
  useFacilities,
  type Facility,
} from '../../features/facilities/api';
import { FacilityFormDialog } from '../../features/facilities/FacilityFormDialog';
import { getApiErrorMessage } from '../../lib/errors';

export default function FacilitiesPage() {
  const { data: me } = useMe();
  const showCorp = hasPermission(me, 'corporation.manage');
  const { data, isLoading } = useFacilities();
  const del = useDeleteFacility();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [deleting, setDeleting] = useState<Facility | null>(null);
  const [viewing, setViewing] = useState<Facility | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success('店舗を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const colCount = showCorp ? 6 : 5;

  return (
    <div>
      <PageHeader
        title="店舗管理"
        description="店舗（施設）の一覧・登録・編集・削除"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            新規登録
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {showCorp && <TableHead>法人</TableHead>}
              <TableHead>店舗名</TableHead>
              <TableHead>サービス種別</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">利用者</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                  読み込み中…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                  店舗がまだ登録されていません。
                </TableCell>
              </TableRow>
            )}

            {data?.map((f) => (
              <TableRow
                key={f.id}
                className="cursor-pointer"
                onClick={() => setViewing(f)}
              >
                {showCorp && (
                  <TableCell className="text-muted-foreground">
                    {f.corporation?.name ?? '—'}
                  </TableCell>
                )}
                <TableCell className="font-medium text-foreground">
                  {f.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f.serviceType ? SERVICE_TYPE_LABELS[f.serviceType] : '—'}
                </TableCell>
                <TableCell>
                  {f.status === 'active' ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      有効
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      無効
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {f._count?.users ?? 0}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(f);
                        setFormOpen(true);
                      }}
                      title="編集"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleting(f)}
                      title="削除"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <DetailDialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.name ?? ''}
        description="店舗の詳細"
        rows={
          viewing
            ? [
                { label: '法人', value: viewing.corporation?.name },
                {
                  label: 'サービス種別',
                  value: viewing.serviceType
                    ? SERVICE_TYPE_LABELS[viewing.serviceType]
                    : '',
                },
                { label: 'ステータス', value: viewing.status === 'active' ? '有効' : '無効' },
                { label: '連絡先メール', value: viewing.email },
                { label: '設立年月日', value: formatDate(viewing.establishedOn) },
                { label: '住所', value: formatAddress(viewing) },
                { label: '電話番号', value: viewing.phone },
                { label: '利用者数', value: `${viewing._count?.users ?? 0}` },
                { label: '備考', value: viewing.remarks },
              ]
            : []
        }
        onEdit={() => {
          if (viewing) {
            setEditing(viewing);
            setFormOpen(true);
          }
          setViewing(null);
        }}
      />

      <FacilityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        target={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="店舗を削除しますか？"
        description={`「${deleting?.name ?? ''}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
