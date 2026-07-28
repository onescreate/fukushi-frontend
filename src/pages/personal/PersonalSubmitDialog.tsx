import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '../../lib/errors';
import { useMySubmit } from '../../features/schedules/myApi';
import type { Schedule } from '../../features/schedules/api';

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

// 用件を note 文字列（例「通院：精神科」「ハローワーク：その他内容」）に組み立てる。
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
  `rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
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
  const [planIn, setPlanIn] = useState('09:00');
  const [planOut, setPlanOut] = useState('16:00');
  const [note, setNote] = useState('');
  const [breaks, setBreaks] = useState<BreakRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setPlanIn(existing?.planIn ?? '09:00');
      setPlanOut(existing?.planOut ?? '16:00');
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
    try {
      const res = await submit.mutateAsync({
        planDate: date,
        planIn,
        planOut,
        note: note || undefined,
        breaks: breaks
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
      <DialogContent className="max-h-[88vh] max-w-[28rem] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{date} の通所予定</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500">通所（開始）</span>
              <Input
                type="time"
                value={planIn}
                onChange={(e) => setPlanIn(e.target.value)}
                className="h-12 text-base"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500">退所（終了）</span>
              <Input
                type="time"
                value={planOut}
                onChange={(e) => setPlanOut(e.target.value)}
                className="h-12 text-base"
              />
            </label>
          </div>

          {/* 中抜け */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                中抜け（通院・ハローワーク等）
              </span>
              <button
                type="button"
                onClick={addBreak}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 active:bg-slate-200"
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
                className="space-y-2.5 rounded-xl border border-slate-200 p-2.5"
              >
                {/* 時間 */}
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

                {/* 用件（通院／ハローワーク／その他） */}
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

                {/* サブ選択（通院・ハローワーク） */}
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

                {/* 自由入力（その他 / 診療科その他） */}
                {(b.category === 'その他' || b.sub === 'その他') && (
                  <Input
                    value={b.freeText}
                    onChange={(e) => setField(i, 'freeText', e.target.value)}
                    className="h-10"
                    placeholder={
                      b.category === '通院' ? '診療科を入力' : '内容を入力'
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-500">
              連絡事項（任意）
            </span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-11"
            />
          </label>

          <DialogFooter className="gap-2">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
