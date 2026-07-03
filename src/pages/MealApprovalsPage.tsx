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
  useDecideMeal,
  usePendingMeals,
} from '../features/meals/reservationApi';
import { getApiErrorMessage } from '../lib/errors';
import { formatDate } from '../lib/format';

const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;

export default function MealApprovalsPage() {
  const { data, isLoading } = usePendingMeals();
  const decide = useDecideMeal();

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
        title="食事承認"
        description="利用者から申請された食事の予約・取消を承認・却下します。"
      />

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>利用者</TableHead>
              <TableHead>利用日</TableHead>
              <TableHead>申請</TableHead>
              <TableHead className="text-right">金額</TableHead>
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
                  承認待ちの食事申請はありません。
                </TableCell>
              </TableRow>
            )}
            {data?.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-foreground">
                  {m.userName}
                </TableCell>
                <TableCell>{formatDate(m.mealDate)}</TableCell>
                <TableCell>
                  {m.requestType === 'cancel' ? (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                      取消（キャンセル料あり）
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      予約
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {yen(m.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => handle(m.id, 'approve')} disabled={decide.isPending}>
                      <Check className="size-4" />
                      承認
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handle(m.id, 'reject')} disabled={decide.isPending}>
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
