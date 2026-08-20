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

/** "YYYY-MM-DD" を "YYYY年M月D日" に整形。 */
function formatJDate(ds: string): string {
  const [y, m, d] = ds.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/** 自動判定の表示（食事提供＝喫食実績から自動。手では変えられない）。 */
function Check({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
      ✓
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

/**
 * 加算のチェック（クリックで付け外し）。
 * 以前は「✓ か —」だけで押せると分からなかったため、四角い枠のチェックボックスにして
 * 見た目で編集できると分かるようにする。印刷にも枠と✓がそのまま出る。
 */
function FlagCheckbox({
  on,
  label,
  disabled,
  onToggle,
}: {
  on: boolean;
  label: string;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      title={disabled ? undefined : `${label}を${on ? '外す' : '付ける'}`}
      className={`mx-auto flex size-6 items-center justify-center rounded-md border-2 text-sm font-black transition-colors ${
        on
          ? 'border-emerald-500 text-emerald-600'
          : 'border-slate-300 text-transparent'
      } ${
        disabled
          ? 'cursor-default opacity-60'
          : 'cursor-pointer hover:border-emerald-500 hover:bg-emerald-50'
      }`}
    >
      ✓
    </button>
  );
}

export default function ClosingOperationsPage() {
  const { facilityId, isMulti, singleFacilityId } = useFacility();
  const now = new Date();
  const [date, setDate] = useState(
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  );

  const { data, isLoading } = useClosingOperations(facilityId, date);
  const save = useSaveClosingOperation();

  const toggle = async (r: ClosingRow, key: ClosingFlag) => {
    // 店舗を1つに絞っていなくても入力できる（サーバー側で利用者ごとに操作権限を検証している）。
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
          <span className="text-sm font-bold text-slate-700">
            当日通所人数 {data?.attendeeCount ?? 0} 人
          </span>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-4" />
              実績記録を印刷 / PDF
            </Button>
          )}
        </div>

        {!singleFacilityId && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            複数店舗の実績をまとめて表示しています。加算のチェックはこのままでも入力できます。
          </div>
        )}
        <p className="mb-4 text-[12px] font-medium text-slate-400">
          加算（地域連携会議・移行準備支援・欠席時対応）は<span className="font-bold text-slate-600">□をクリック</span>して付け外しします（その場で保存）。
          食事提供は喫食の記録から自動で付きます。
        </p>
      </div>

      {facilityId && (
        <Card className="overflow-hidden p-0 print-area">
          <div className="hidden px-6 pt-4 print:block">
            <div className="text-center text-lg font-bold">{formatJDate(date)}</div>
            <div className="mt-0.5 text-center text-sm font-semibold">
              当日通所人数 {data?.attendeeCount ?? 0} 人
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                {isMulti && <TableHead>店舗</TableHead>}
                <TableHead>予定時間</TableHead>
                <TableHead>打刻時間</TableHead>
                <TableHead className="text-center">
                  食事提供
                  <span className="ml-1 text-[10px] font-normal text-slate-400">自動</span>
                </TableHead>
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
                  <TableCell colSpan={isMulti ? 8 : 7} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isMulti ? 8 : 7} className="py-10 text-center text-muted-foreground">
                    この日の対象者（通所予定・打刻）はいません。
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.userId}>
                    <TableCell className="font-medium text-foreground">
                      {r.userName}
                      {r.noSchedule && (
                        <span className="ml-1.5 rounded bg-sky-100 px-1 py-0.5 text-[10px] font-bold text-sky-700">
                          予定外
                        </span>
                      )}
                    </TableCell>
                    {isMulti && (
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
                        <FlagCheckbox
                          on={r[f.key]}
                          label={`${r.userName} の${f.label}`}
                          disabled={save.isPending}
                          onToggle={() => toggle(r, f.key)}
                        />
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
