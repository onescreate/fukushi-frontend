import type { ReactNode } from 'react';

/**
 * 各ページ共通の見出し（KGI踏襲のパンくず様式）。
 * 「福祉 / ページ名」を小さめ太字で表示し、任意で説明・右アクション。
 */
export function PageHeader({
  title,
  description,
  action,
  parent = '福祉',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** パンくずの親ラベル（既定: 福祉） */
  parent?: string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[14px] font-bold leading-none">
          <span className="font-semibold text-slate-400">{parent}</span>
          <span className="text-slate-300">/</span>
          <span className="truncate text-slate-800">{title}</span>
        </div>
        {description && (
          <p className="mt-2 text-[12px] font-medium text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
