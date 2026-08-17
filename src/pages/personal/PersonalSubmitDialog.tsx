import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '../../lib/errors';
import { formatDate } from '../../lib/format';
import { breakOrderError, planOrderError } from '../../lib/timeRange';
import { useMySubmit } from '../../features/schedules/myApi';
import type { Schedule } from '../../features/schedules/api';

type DayType = 'commute' | 'practice';
type BreakCategory = '' | '通院' | 'ハローワーク' | 'その他';

// 用件のサブ選択肢（通院・ハローワークのみ。「その他」は自由入力）。
const SUB_OPTIONS: Record<'通院' | 'ハローワーク', string[]> = {
  通院: ['精神科', 'その他'],
  ハローワーク: ['失業認定日', '面談日', 'その他'],
};

interface BreakRow {
  plannedOut: string;
  plannedIn: string;
  category: BreakCategory;
  sub: string;
  freeText: string;
}

// 用件を note 文字列（例「通院：精神科」）に組み立てる。
function composeBreakNote(b: BreakRow): string | undefined {
  if (!b.category) return undefined;
  if (b.category === 'その他') {
    const t = b.freeText.trim();
    return t ? `その他：${t}` : 'その他';
  }
  const detail = b.sub === 'その他' ? b.freeText.trim() : b.sub;
  return detail ? `${b.category}：${detail}` : b.category;
}

// note 文字列を用件の選択状態へ復元する（編集時）。
function parseBreakNote(
  note: string | null,
): Pick<BreakRow, 'category' | 'sub' | 'freeText'> {
  const n = (note ?? '').trim();
  const m = n.match(/^(通院|ハローワーク|その他)[：:]?\s*(.*)$/);
  if (!m) return { category: '', sub: '', freeText: '' };
  const cat = m[1] as BreakCategory;
  const rest = (m[2] ?? '').trim();
  if (cat === 'その他') return { category: 'その他', sub: '', freeText: rest };
  const opts = SUB_OPTIONS[cat as '通院' | 'ハローワーク'];
  if (!rest) return { category: cat, sub: '', freeText: '' };
  if (opts.includes(rest)) return { category: cat, sub: rest, freeText: '' };
  return { category: cat, sub: 'その他', freeText: rest };
}

const pill = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
    active
      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
      : 'border-slate-200 text-slate-500 active:bg-slate-100'
  }`;

export function PersonalSubmitDialog({
  open,
  onOpenChange,
  date,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existing: Schedule | null;
}) {
  const submit = useMySubmit();
  const [dayType, setDayType] = useState<DayType>('commute');
  const [planIn, setPlanIn] = useState('10:00');
  const [planOut, setPlanOut] = useState('15:00');
  const [practicePlace, setPracticePlace] = useState('');
  const [note, setNote] = useState('');
  const [breaks, setBreaks] = useState<BreakRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const practice = (existing?.details ?? []).find(
        (d) => d.eventType === 'practice',
      );
      setDayType(practice ? 'practice' : 'commute');
      setPracticePlace(practice?.note ?? '');
      setPlanIn(existing?.planIn ?? '10:00');
      // 打刻で自動作成された予定は終了時刻が空。ここで既定値(15:00)を入れると
      // 開始(打刻時刻)より前になり、逆転した予定ができてしまうため空のままにする。
      setPlanOut(existing ? (existing.planOut ?? '') : '15:00');
      setNote(existing?.note ?? '');
      setBreaks(
        (existing?.details ?? [])
          .filter((d) => d.eventType === 'break_out')
          .map((d) => ({
            plannedOut: d.plannedOut ?? '',
            plannedIn: d.plannedIn ?? '',
            ...parseBreakNote(d.note),
          })),
      );
      setError('');
    }
  }, [open, existing]);

  const addBreak = () =>
    setBreaks((b) => [
      ...b,
      { plannedOut: '', plannedIn: '', category: '', sub: '', freeText: '' },
    ]);
  const removeBreak = (i: number) =>
    setBreaks((b) => b.filter((_, idx) => idx !== i));
  const setField = (i: number, key: keyof BreakRow, val: string) =>
    setBreaks((b) => b.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const setCategory = (i: number, cat: BreakCategory) =>
    setBreaks((b) =>
      b.map((r, idx) =>
        idx === i ? { ...r, category: cat, sub: '', freeText: '' } : r,
      ),
    );
  const setSub = (i: number, sub: string) =>
    setBreaks((b) =>
      b.map((r, idx) =>
        idx === i
          ? { ...r, sub, freeText: sub === 'その他' ? r.freeText : '' }
          : r,
      ),
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (dayType === 'practice' && !practicePlace.trim()) {
      setError('実習先を入力してください。');
      return;
    }
    const orderError = planOrderError(planIn, planOut);
    if (orderError) {
      setError(orderError);
      return;
    }
    if (dayType === 'commute') {
      for (const b of breaks) {
        const e2 = breakOrderError(b.plannedOut, b.plannedIn);
        if (e2) {
          setError(e2);
          return;
        }
      }
    }
    try {
      const res = await submit.mutateAsync({
        planDate: date,
        planIn,
        planOut,
        note: note || undefined,
        practicePlace:
          dayType === 'practice' ? practicePlace.trim() : undefined,
        breaks:
          dayType === 'practice'
            ? []
            : breaks
                .filter((b) => b.plannedOut || b.plannedIn)
                .map((b) => ({
                  plannedOut: b.plannedOut || undefined,
                  plannedIn: b.plannedIn || undefined,
                  note: composeBreakNote(b),
                })),
      });
      toast.success(
        res.autoApproved ? '予定を登録しました' : '予定を申請しました（承認待ち）',
      );
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {formatDate(date)} の予定
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          {/* 却下されている日は、その理由をここで伝える（出し直せば消える） */}
          {existing?.status === 'rejected' && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-bold text-rose-700">
                この日の申請は却下されています
              </p>
              {existing.rejectReason && (
                <p className="mt-1 text-sm text-rose-700">
                  理由：{existing.rejectReason}
                </p>
              )}
              <p className="mt-1 text-xs text-rose-600">
                内容を直して、もう一度申請してください。
              </p>
            </div>
          )}

          {/* 種別（通所／実習） */}
          <section className="space-y-2">
            <span className="text-sm font-bold text-slate-700">種別</span>
            <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-100 p-1">
              {(
                [
                  ['commute', '通所'],
                  ['practice', '実習'],
                ] as const
              ).map(([v, label]) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setDayType(v)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors ${
                    dayType === v
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* 実習先（実習のとき） */}
          {dayType === 'practice' && (
            <section className="space-y-2">
              <span className="text-sm font-bold text-slate-700">
                実習先 <span className="text-rose-500">*</span>
              </span>
              <Input
                value={practicePlace}
                onChange={(e) => setPracticePlace(e.target.value)}
                placeholder="例：〇〇株式会社"
                className="h-12 text-base"
              />
            </section>
          )}

          {/* 時間 */}
          <section className="space-y-2">
            <span className="text-sm font-bold text-slate-700">時間</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  {dayType === 'practice' ? '開始' : '通所（開始）'}
                </span>
                <Input
                  type="time"
                  value={planIn}
                  onChange={(e) => setPlanIn(e.target.value)}
                  className="h-12 text-base"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500">
                  {dayType === 'practice' ? '終了' : '退所（終了）'}
                </span>
                <Input
                  type="time"
                  value={planOut}
                  onChange={(e) => setPlanOut(e.target.value)}
                  className="h-12 text-base"
                />
              </label>
            </div>
          </section>

          {/* 中抜け（通所のときのみ） */}
          {dayType === 'commute' && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">
                  中抜け（通院・ハローワーク等）
                </span>
                <button
                  type="button"
                  onClick={addBreak}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 active:bg-slate-200"
                >
                  <Plus className="size-3.5" /> 追加
                </button>
              </div>
              {breaks.length === 0 && (
                <p className="text-xs text-slate-400">
                  通院・ハローワーク等で外出する予定があれば追加してください。
                </p>
              )}
              {breaks.map((b, i) => (
                <div
                  key={i}
                  className="space-y-2.5 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={b.plannedOut}
                      onChange={(e) => setField(i, 'plannedOut', e.target.value)}
                      className="h-11 flex-1 text-base"
                      aria-label="外出"
                    />
                    <span className="text-slate-400">→</span>
                    <Input
                      type="time"
                      value={b.plannedIn}
                      onChange={(e) => setField(i, 'plannedIn', e.target.value)}
                      className="h-11 flex-1 text-base"
                      aria-label="戻り"
                    />
                    <button
                      type="button"
                      onClick={() => removeBreak(i)}
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 active:bg-slate-100"
                      aria-label="削除"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* 用件 */}
                  <div className="flex flex-wrap gap-1.5">
                    {(['通院', 'ハローワーク', 'その他'] as const).map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setCategory(i, c)}
                        className={pill(b.category === c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {(b.category === '通院' || b.category === 'ハローワーク') && (
                    <div className="flex flex-wrap gap-1.5">
                      {SUB_OPTIONS[b.category].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setSub(i, s)}
                          className={pill(b.sub === s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {(b.category === 'その他' || b.sub === 'その他') && (
                    <Input
                      value={b.freeText}
                      onChange={(e) => setField(i, 'freeText', e.target.value)}
                      className="h-11"
                      placeholder={
                        b.category === '通院' ? '診療科を入力' : '内容を入力'
                      }
                    />
                  )}
                </div>
              ))}
            </section>
          )}

          {/* 連絡事項 */}
          <section className="space-y-2">
            <span className="text-sm font-bold text-slate-700">
              連絡事項（任意）
            </span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11"
            />
          </section>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submit.isPending}
              className="h-12 flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={submit.isPending}
              className="h-12 flex-1"
            >
              {submit.isPending ? '送信中…' : '申請する'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
