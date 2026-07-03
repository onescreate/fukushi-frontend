import { useState } from 'react';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DetailDialog } from '@/components/DetailDialog';
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
  ROLE_LABELS,
  useDeleteStaff,
  useStaffList,
  type Staff,
} from '../../features/staff/api';
import { StaffFormDialog } from '../../features/staff/StaffFormDialog';
import { ResetPasswordDialog } from '../../features/staff/ResetPasswordDialog';
import { getApiErrorMessage } from '../../lib/errors';

function roleText(s: Staff): string {
  if (s.facilityRoles.length === 0) return '—';
  return s.facilityRoles
    .map(
      (r) =>
        `${ROLE_LABELS[r.role] ?? r.role}${r.facility ? `（${r.facility.name}）` : ''}`,
    )
    .join(' / ');
}

export default function StaffPage() {
  const { data, isLoading } = useStaffList();
  const del = useDeleteStaff();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [resetting, setResetting] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState<Staff | null>(null);
  const [viewing, setViewing] = useState<Staff | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success('職員を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="職員管理"
        description="職員の登録・権限設定・アカウント発行"
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
              <TableHead>氏名</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>権限</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
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
                  職員がまだ登録されていません。
                </TableCell>
              </TableRow>
            )}

            {data?.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => setViewing(s)}
              >
                <TableCell className="font-medium text-foreground">
                  {s.lastName} {s.firstName}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {roleText(s)}
                </TableCell>
                <TableCell>
                  {s.status === 'active' ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      有効
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      無効
                    </span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(s);
                        setFormOpen(true);
                      }}
                      title="編集"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setResetting(s)}
                      title="パスワード再設定"
                    >
                      <KeyRound className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleting(s)}
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
        title={viewing ? `${viewing.lastName} ${viewing.firstName}` : ''}
        description="職員の詳細"
        rows={
          viewing
            ? [
                { label: 'メールアドレス', value: viewing.email },
                { label: '権限', value: roleText(viewing) },
                { label: 'ステータス', value: viewing.status === 'active' ? '有効' : '無効' },
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

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        target={editing}
      />

      <ResetPasswordDialog
        open={!!resetting}
        onOpenChange={(o) => !o && setResetting(null)}
        staff={resetting}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="職員を削除しますか？"
        description={`「${deleting?.lastName ?? ''} ${deleting?.firstName ?? ''}」を削除します。ログインアカウントも削除されます。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
