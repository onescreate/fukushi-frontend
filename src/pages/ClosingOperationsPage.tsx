import { pad } from '@/lib/format';
import { useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFacility } from '../contexts/FacilityContext';
import {
  useClosingOperations,
  useSaveClosingOperation,
  type ClosingFlag,
  type ClosingRow,
} from '../features/closing/api';
import { getApiErrorMessage } from '../lib/errors';

const FLAGS: { key: ClosingFlag; label: string }[] = [
  { key: 'regionalCooperation', label: '地域連携会議' },
  { key: 'transitionPrep', label: '移行準備支援' },
  { key: 'absenceHandling', label: '欠席時対応' },
];

function Check({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
      ✓
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

export default function ClosingOperationsPage() {
  const { facilityId, isAll } = useFacility();
  const now = new Date();
  const [date, setDate] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  );

  const { data, isLoading } = useClosingOperations(facilityId, date);
  const save = useSaveClosingOperation();

  const toggle = async (r: ClosingRow, key: ClosingFlag) => {
    if (isAll) return; // 全店舗表示中は入力不可
    try {
      await save.mutateAsync({
        userId: r.userId,
        date,
        data: {
          regionalCooperation: r.regionalCooperation,
          transitionPrep: r.transitionPrep,
          absenceHandling: r.absenceHandling,
          [key]: !r[key],
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const rows = data?.rows ?? [];

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="締め業務（実績記録）"
          description="その日の予定・打刻・加算（食事提供／地域連携会議／移行準備支援／欠席時対応）を確認・記録します。"
        />

        <div className="mb-4 flex items-center gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          {rows.length > 0 && (
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-4" />
              実績記録を印刷 / PDF
            </Button>
          )}
        </div>

        {isAll && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            全店舗の実績を表示しています（閲覧のみ）。加算を入力するにはヘッダーで店舗を選択してください。
          </div>
        )}
      </div>

      {facilityId && (
        <Card className="overflow-hidden p-0 print-area">
          <div className="hidden px-6 pt-4 text-center text-lg font-bold print:block">
            実績記録（{date}）
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                {isAll && <TableHead>店舗</TableHead>}
                <TableHead>予定時間</TableHead>
                <TableHead>打刻時間</TableHead>
                <TableHead className="text-center">食事提供</TableHead>
                {FLAGS.map((f) => (
                  <TableHead key={f.key} className="text-center">
                    {f.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAll ? 8 : 7} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAll ? 8 : 7} className="py-10 text-center text-muted-foreground">
                    この日の通所予定者はいません。
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-medium text-foreground">{r.userName}</TableCell>
                    {isAll && (
                      <TableCell className="text-xs text-muted-foreground">{r.facilityName ?? '—'}</TableCell>
                    )}
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.planIn ?? '—'}
                      {r.planIn || r.planOut ? '〜' : ''}
                      {r.planOut ?? ''}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.isAbsent ? (
                        <span className="font-bold text-rose-600">欠席</span>
                      ) : (
                        <>
                          {r.actIn ?? '—'}
                          {r.actIn || r.actOut ? '〜' : ''}
                          {r.actOut ?? ''}
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Check on={r.mealProvided} />
                    </TableCell>
                    {FLAGS.map((f) => (
                      <TableCell key={f.key} className="text-center">
                        <button
                          type="button"
                          disabled={isAll || save.isPending}
                          onClick={() => toggle(r, f.key)}
                          className="disabled:cursor-default"
                          title={isAll ? '' : 'クリックで切替'}
                        >
                          <Check on={r[f.key]} />
                        </button>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
