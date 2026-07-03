import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
  useDeleteDevice,
  useDevices,
  type KioskDevice,
} from '../../features/devices/api';
import { DeviceRegisterDialog } from '../../features/devices/DeviceRegisterDialog';
import { getApiErrorMessage } from '../../lib/errors';
import { formatDate } from '../../lib/format';

export default function DevicesPage() {
  const { data, isLoading } = useDevices();
  const del = useDeleteDevice();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deleting, setDeleting] = useState<KioskDevice | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success('端末を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="端末管理"
        description="打刻用タブレット端末の登録・削除"
        action={
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus className="size-4" />
            端末を登録
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>端末名</TableHead>
              <TableHead>設置店舗</TableHead>
              <TableHead>最終利用</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="w-16 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  読み込み中…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  端末がまだ登録されていません。
                </TableCell>
              </TableRow>
            )}
            {data?.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium text-foreground">
                  {d.label}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.facility?.name ?? '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.lastUsedAt
                    ? new Date(d.lastUsedAt).toLocaleString('ja-JP')
                    : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(d.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleting(d)}
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

      <DeviceRegisterDialog open={registerOpen} onOpenChange={setRegisterOpen} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="端末を削除しますか？"
        description={`「${deleting?.label ?? ''}」を削除します。この端末からは打刻できなくなります。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
