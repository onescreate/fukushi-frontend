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
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useFacility } from '../contexts/FacilityContext';
import { SelectStorePrompt } from '../components/layout/SelectStorePrompt';
import {
  useInvoiceSettings,
  useDeleteInvoiceSetting,
  type InvoiceSetting,
} from '../features/meals/invoiceApi';
import { InvoiceSettingFormDialog } from '../features/meals/InvoiceSettingFormDialog';
import { formatDate } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

export default function InvoiceSettingsPage() {
  const { facilityId, singleFacilityId } = useFacility();
  const { data: settings, isLoading } = useInvoiceSettings(singleFacilityId ?? '');
  const del = useDeleteInvoiceSetting();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceSetting | null>(null);
  const [deleting, setDeleting] = useState<InvoiceSetting | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync({ facilityId, id: deleting.id });
      toast.success('発行者情報を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!singleFacilityId) return <SelectStorePrompt title="請求書 発行者情報" />;

  return (
    <div>
      <PageHeader
        title="請求書 発行者情報"
        description="適格請求書に印字する発行者情報（事業者名・登録番号・住所・振込先）を店舗ごとに設定します。適用開始日つきで履歴管理します。"
      />

      {facilityId && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" />
            発行者情報を追加
          </Button>
        </div>
      )}

      {facilityId && (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>適用開始日</TableHead>
                <TableHead>発行者名</TableHead>
                <TableHead>登録番号</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : (settings ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    発行者情報がまだ登録されていません。
                  </TableCell>
                </TableRow>
              ) : (
                (settings ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.effectiveDate)}</TableCell>
                    <TableCell className="font-medium text-foreground">{row.issuerName}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {row.registrationNumber ?? '—'}
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(row);
                            setFormOpen(true);
                          }}
                          aria-label="編集"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(row)} aria-label="削除">
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

      <InvoiceSettingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        facilityId={facilityId}
        target={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="発行者情報を削除しますか？"
        description={`適用開始日「${deleting ? formatDate(deleting.effectiveDate) : ''}」の発行者情報を削除します。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
