import { Search, X } from 'lucide-react';

/** 氏名の比較用に、空白（半角/全角）を除いて小文字に揃える。 */
export function normalizeName(s: string): string {
  return s.replace(/[\s　]/g, '').toLowerCase();
}

/** 利用者名で絞り込めるか判定する（空の検索語はすべて通す）。 */
export function matchesName(name: string, query: string): boolean {
  const q = normalizeName(query);
  return q === '' || normalizeName(name).includes(q);
}

/**
 * 一覧を利用者名で絞り込む入力欄。
 * 予定承認・食事予約など、行数が多くて目的の人を探しづらい画面で共通に使う。
 */
export function UserNameFilter({
  value,
  onChange,
  matched,
  total,
  placeholder = '利用者名で絞り込み',
}: {
  value: string;
  onChange: (v: string) => void;
  /** 絞り込み後の件数（入力があるときだけ表示） */
  matched?: number;
  /** 絞り込み前の件数 */
  total?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-56 rounded-lg border border-input bg-transparent pl-8 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="絞り込みを解除"
            className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      {value && matched !== undefined && (
        <span className="text-xs font-medium text-muted-foreground">
          {matched}件
          {total !== undefined && ` / ${total}件`}
        </span>
      )}
    </div>
  );
}
