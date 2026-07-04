import { useState } from 'react';
import { KeyRound, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DetailDialog } from '@/components/DetailDialog';
import { formatDate } from '../../lib/format';
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
  useDeleteUser,
  useUsersList,
  type AppUser,
} from '../../features/users/api';
import { UserFormDialog } from '../../features/users/UserFormDialog';
import { UserCredentialDialog } from '../../features/users/UserCredentialDialog';
import { getApiErrorMessage } from '../../lib/errors';

export default function UsersPage() {
  const { data: me } = useMe();
  const canManage = hasPermission(me, 'user.manage');
  const { data, isLoading } = useUsersList();
  const del = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const [viewing, setViewing] = useState<AppUser | null>(null);
  const [cred, setCred] = useState<{
    user: AppUser;
    mode: 'pin' | 'password';
  } | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success('利用者を削除しました');
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const colCount = canManage ? 6 : 5;

  return (
    <div>
      <PageHeader
        title="利用者管理"
        description="利用者の登録・アカウント発行（PIN／自宅ログイン）"
        action={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              新規登録
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>ログインID</TableHead>
              <TableHead>店舗</TableHead>
              <TableHead>ステータス</TableHead>
              {canManage && <TableHead className="w-40 text-right">操作</TableHead>}
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
                  利用者がまだ登録されていません。
                </TableCell>
              </TableRow>
            )}

            {data?.map((u) => (
              <TableRow
                key={u.id}
                className="cursor-pointer"
                onClick={() => setViewing(u)}
              >
                <TableCell className="font-medium text-foreground">
                  {u.lastName} {u.firstName}
                  {u.kana && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {u.kana}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {u.loginId}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.facility?.name ?? '—'}
                </TableCell>
                <TableCell>
                  {u.status === 'active' ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      利用中
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      退所
                    </span>
                  )}
                </TableCell>
                {canManage && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(u);
                          setFormOpen(true);
                        }}
                        title="編集"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setCred({ user: u, mode: 'pin' })}
                        title="PIN再設定"
                      >
                        <KeyRound className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setCred({ user: u, mode: 'password' })}
                        title="自宅パスワード再設定"
                      >
                        <Lock className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(u)}
                        title="削除"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <DetailDialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing ? `${viewing.lastName} ${viewing.firstName}` : ''}
        description="利用者の詳細"
        rows={
          viewing
            ? [
                { label: 'フリガナ', value: viewing.kana },
                { label: 'ログインID', value: viewing.loginId },
                { label: '店舗', value: viewing.facility?.name },
                { label: 'ステータス', value: viewing.status === 'active' ? '利用中' : '退所' },
                { label: '受給者証番号', value: viewing.certNumber },
                { label: '身長', value: viewing.heightCm ? `${viewing.heightCm} cm` : '' },
                {
                  label: '食事料金区分',
                  value: viewing.useSpecialMealFee
                    ? '特別料金（店舗の特別食事料金）'
                    : '通常料金（店舗の通常食事料金）',
                },
                { label: '登録日', value: formatDate(viewing.createdAt) },
              ]
            : []
        }
        onEdit={
          canManage
            ? () => {
                if (viewing) {
                  setEditing(viewing);
                  setFormOpen(true);
                }
                setViewing(null);
              }
            : undefined
        }
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        target={editing}
      />

      <UserCredentialDialog
        open={!!cred}
        onOpenChange={(o) => !o && setCred(null)}
        user={cred?.user ?? null}
        mode={cred?.mode ?? 'pin'}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="利用者を削除しますか？"
        description={`「${deleting?.lastName ?? ''} ${deleting?.firstName ?? ''}」を削除します。ログインアカウントも削除されます。`}
        confirmLabel="削除する"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
