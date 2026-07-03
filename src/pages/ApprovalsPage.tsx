import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
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
  useDecideSchedule,
  usePendingSchedules,
} from '../features/schedules/approvalApi';
import { getApiErrorMessage } from '../lib/errors';
import { formatDate } from '../lib/format';

export default function ApprovalsPage() {
  const { data, isLoading } = usePendingSchedules();
  const decide = useDecideSchedule();

  const handle = async (id: string, decision: 'approve' | 'reject') => {
    try {
      await decide.mutateAsync({ id, decision });
      toast.success(decision === 'approve' ? '承認しました' : '却下しました');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="予定承認"
        description="利用者から申請された予定を承認・却下します。"
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>利用者</TableHead>
              <TableHead>日付</TableHead>
              <TableHead>時間</TableHead>
              <TableHead>連絡事項</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
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
                  承認待ちの予定はありません。
                </TableCell>
              </TableRow>
            )}
            {data?.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium text-foreground">
                  {s.user.lastName} {s.user.firstName}
                </TableCell>
                <TableCell>{formatDate(s.planDate)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.planIn ?? ''}
                  {s.planIn && s.planOut ? '〜' : ''}
                  {s.planOut ?? ''}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.note ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handle(s.id, 'approve')}
                      disabled={decide.isPending}
                    >
                      <Check className="size-4" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handle(s.id, 'reject')}
                      disabled={decide.isPending}
                    >
                      <X className="size-4" />
                      却下
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
