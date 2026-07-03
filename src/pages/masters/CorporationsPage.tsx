import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  useCorporations,
  useDeleteCorporation,
  type Corporation,
} from '../../features/corporations/api';
import { CorporationFormDialog } from '../../features/corporations/CorporationFormDialog';
import { getApiErrorMessage } from '../../lib/errors';

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return status === 'active' ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      有効
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      無効
    </span>
  );
}

export default function CorporationsPage() {
  const { data, isLoading } = useCorporations();
  const del = useDeleteCorporation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Corporation | null>(null);
  const [deleting, setDeleting] = useState<Corporation | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: Corporation) => {
    setEditing(c);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success('法人を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="法人管理"
        description="法人の一覧・登録・編集・削除"
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            新規登録
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>法人名</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">店舗</TableHead>
              <TableHead className="text-right">利用者</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  読み込み中…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  法人がまだ登録されていません。
                </TableCell>
              </TableRow>
            )}

            {data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-foreground">
                  {c.name}
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c._count?.facilities ?? 0}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c._count?.users ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString('ja-JP')}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(c)}
                      title="編集"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleting(c)}
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

      <CorporationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        target={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="法人を削除しますか？"
        description={`「${deleting?.name ?? ''}」を削除します。この操作は取り消せません。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
