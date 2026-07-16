import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFacility } from '../contexts/FacilityContext';
import { hasPermission, useMe } from '../features/auth/useMe';
import {
  useHealthRecords,
  useUpsertHealthRecord,
  type HealthRow,
} from '../features/health/api';
import { formatDate, pad } from '../lib/format';
import { getApiErrorMessage } from '../lib/errors';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function bmiLabel(bmi: number | null) {
  if (bmi == null) return { text: '—', cls: 'text-muted-foreground' };
  if (bmi < 18.5) return { text: `${bmi}（低体重）`, cls: 'text-sky-600' };
  if (bmi < 25) return { text: `${bmi}（標準）`, cls: 'text-emerald-600' };
  if (bmi < 30) return { text: `${bmi}（肥満1度）`, cls: 'text-amber-600' };
  return { text: `${bmi}（肥満2度〜）`, cls: 'text-rose-600' };
}

export default function HealthRecordsPage() {
  const { data: me } = useMe();
  const canEdit = hasPermission(me, 'health.edit');
  const { facilityId, isAll } = useFacility();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useHealthRecords(facilityId, year, month);
  const upsert = useUpsertHealthRecord();

  const [target, setTarget] = useState<HealthRow | null>(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [measuredOn, setMeasuredOn] = useState(today());
  const [note, setNote] = useState('');

  const bmiPreview = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return null;
    const m = h / 100;
    return Math.round((w / (m * m)) * 10) / 10;
  }, [weight, height]);

  const openEdit = (r: HealthRow) => {
    setTarget(r);
    setWeight(r.weightKg != null ? String(r.weightKg) : '');
    setHeight(r.heightCm != null ? String(r.heightCm) : '');
    setMeasuredOn(r.measuredOn ?? today());
    setNote(r.note ?? '');
  };

  const save = async () => {
    if (!target) return;
    try {
      await upsert.mutateAsync({
        userId: target.userId,
        year,
        month,
        data: {
          weightKg: weight ? Number(weight) : undefined,
          heightCm: height ? Number(height) : undefined,
          measuredOn,
          note: note || undefined,
        },
      });
      toast.success('健康記録を保存しました');
      setTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const changeMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    else if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const colCount = 6 + (isAll ? 1 : 0) + (canEdit ? 1 : 0);

  return (
    <div>
      <PageHeader
        title="体重・BMI（健康記録）"
        description="利用者の身長・体重を月ごとに記録します。BMIは自動計算されます。"
      />

      <div className="mb-4 flex items-center gap-2">
        <Button variant="outline" size="icon-sm" onClick={() => changeMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="w-24 text-center text-sm font-semibold">
          {year}年 {month}月
        </span>
        <Button variant="outline" size="icon-sm" onClick={() => changeMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {facilityId && (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>利用者</TableHead>
                {isAll && <TableHead>店舗</TableHead>}
                <TableHead className="text-right">身長(cm)</TableHead>
                <TableHead className="text-right">体重(kg)</TableHead>
                <TableHead>BMI</TableHead>
                <TableHead>最終測定日</TableHead>
                <TableHead>備考</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                    読み込み中…
                  </TableCell>
                </TableRow>
              ) : (data?.rows ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                    利用者がいません。
                  </TableCell>
                </TableRow>
              ) : (
                (data?.rows ?? []).map((r) => {
                  const bmi = bmiLabel(r.bmi);
                  const notEntered = r.measuredOn == null;
                  return (
                    <TableRow key={r.userId} className={notEntered ? 'bg-amber-50/40' : ''}>
                      <TableCell className="font-medium text-foreground">{r.userName}</TableCell>
                      {isAll && (
                        <TableCell className="text-xs text-muted-foreground">
                          {r.facilityName ?? '—'}
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums">{r.heightCm ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {r.weightKg ?? '—'}
                      </TableCell>
                      <TableCell className={`font-medium ${bmi.cls}`}>{bmi.text}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.measuredOn ? formatDate(r.measuredOn) : '未入力'}
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                        {r.note ?? '—'}
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} title="記録">
                            <Pencil className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{target?.userName} さんの記録</DialogTitle>
            <DialogDescription>
              {year}年{month}月・身長と体重を入力するとBMIが計算されます。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="h-height">身長(cm)</Label>
                <Input id="h-height" type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="h-weight">体重(kg)</Label>
                <Input id="h-weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              BMI: <span className="font-semibold">{bmiPreview ?? '—'}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-date">測定日</Label>
              <Input id="h-date" type="date" value={measuredOn} onChange={(e) => setMeasuredOn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-note">備考（任意）</Label>
              <Input id="h-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={upsert.isPending}>
              キャンセル
            </Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
